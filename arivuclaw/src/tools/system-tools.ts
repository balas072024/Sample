/**
 * ArivuClaw System Tools — Direct system access for unrestricted/local-admin mode.
 *
 * These tools provide full system control when running on your local laptop.
 */

import { execSync, exec } from "child_process";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";

const log = Logger.create("system-tools");

export class SystemTools {
  // ─── System Information ──────────────────────────────────────────

  static getFullSystemInfo(): Record<string, unknown> {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
      freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))}GB`,
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
      user: os.userInfo().username,
      shell: os.userInfo().shell,
      networkInterfaces: this.getNetworkInterfaces(),
      loadAvg: os.loadavg(),
    };
  }

  static getNetworkInterfaces(): Record<string, string[]> {
    const interfaces = os.networkInterfaces();
    const result: Record<string, string[]> = {};
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        result[name] = addrs
          .filter((a) => !a.internal)
          .map((a) => `${a.address} (${a.family})`);
      }
    }
    return result;
  }

  // ─── Process Management ──────────────────────────────────────────

  static listProcesses(filter?: string): string {
    const cmd = filter
      ? `ps aux | grep -i '${filter}' | grep -v grep`
      : "ps aux --sort=-%mem | head -20";
    return this.run(cmd);
  }

  static killProcess(pid: number, signal: string = "SIGTERM"): string {
    return this.run(`kill -${signal} ${pid}`);
  }

  // ─── Package Management ──────────────────────────────────────────

  static detectPackageManager(): string {
    const managers = ["apt", "dnf", "yum", "pacman", "brew", "apk"];
    for (const pm of managers) {
      try {
        execSync(`which ${pm}`, { stdio: "ignore" });
        return pm;
      } catch {
        continue;
      }
    }
    return "unknown";
  }

  static installPackage(packageName: string, manager?: string): string {
    const pm = manager || this.detectPackageManager();
    const cmds: Record<string, string> = {
      apt: `sudo apt-get install -y ${packageName}`,
      dnf: `sudo dnf install -y ${packageName}`,
      yum: `sudo yum install -y ${packageName}`,
      pacman: `sudo pacman -S --noconfirm ${packageName}`,
      brew: `brew install ${packageName}`,
      apk: `sudo apk add ${packageName}`,
    };

    const cmd = cmds[pm];
    if (!cmd) throw new Error(`Unsupported package manager: ${pm}`);

    log.info(`Installing ${packageName} via ${pm}...`);
    return this.run(cmd, 300_000);
  }

  // ─── Service Management ──────────────────────────────────────────

  static manageService(service: string, action: string): string {
    return this.run(`sudo systemctl ${action} ${service}`);
  }

  // ─── Clipboard ───────────────────────────────────────────────────

  static clipboardRead(): string {
    const platform = os.platform();
    switch (platform) {
      case "linux":
        return this.run("xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null");
      case "darwin":
        return this.run("pbpaste");
      case "win32":
        return this.run("powershell -command Get-Clipboard");
      default:
        throw new Error(`Clipboard not supported on ${platform}`);
    }
  }

  static clipboardWrite(text: string): void {
    const platform = os.platform();
    const escaped = text.replace(/'/g, "'\\''");
    switch (platform) {
      case "linux":
        this.run(`echo '${escaped}' | xclip -selection clipboard 2>/dev/null || echo '${escaped}' | xsel --clipboard --input`);
        break;
      case "darwin":
        this.run(`echo '${escaped}' | pbcopy`);
        break;
      case "win32":
        this.run(`powershell -command "Set-Clipboard -Value '${escaped}'"`);
        break;
      default:
        throw new Error(`Clipboard not supported on ${platform}`);
    }
  }

  // ─── Screenshot ──────────────────────────────────────────────────

  static takeScreenshot(outputPath: string, delay: number = 0): string {
    const platform = os.platform();
    switch (platform) {
      case "linux":
        return this.run(`scrot ${delay ? `-d ${delay}` : ""} '${outputPath}' 2>/dev/null || gnome-screenshot -f '${outputPath}' ${delay ? `-d ${delay}` : ""}`);
      case "darwin":
        return this.run(`screencapture ${delay ? `-T ${delay}` : ""} '${outputPath}'`);
      case "win32":
        return this.run(`powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | ForEach-Object { $bitmap = New-Object System.Drawing.Bitmap($_.Bounds.Width, $_.Bounds.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($_.Bounds.Location, [System.Drawing.Point]::Empty, $_.Bounds.Size); $bitmap.Save('${outputPath}') }"`);
      default:
        throw new Error(`Screenshot not supported on ${platform}`);
    }
  }

  // ─── Text-to-Speech ──────────────────────────────────────────────

  static textToSpeech(text: string, outputPath?: string): string {
    const platform = os.platform();
    const escaped = text.replace(/'/g, "'\\''");

    if (outputPath) {
      // Save to file
      switch (platform) {
        case "linux":
          return this.run(`espeak-ng '${escaped}' --stdout > '${outputPath}' 2>/dev/null || espeak '${escaped}' --stdout > '${outputPath}'`);
        case "darwin":
          return this.run(`say '${escaped}' -o '${outputPath}'`);
        default:
          throw new Error(`TTS not supported on ${platform}`);
      }
    } else {
      // Play directly
      switch (platform) {
        case "linux":
          return this.run(`espeak-ng '${escaped}' 2>/dev/null || espeak '${escaped}'`);
        case "darwin":
          return this.run(`say '${escaped}'`);
        default:
          throw new Error(`TTS not supported on ${platform}`);
      }
    }
  }

  // ─── Notification ────────────────────────────────────────────────

  static sendNotification(title: string, message: string): string {
    const platform = os.platform();
    switch (platform) {
      case "linux":
        return this.run(`notify-send '${title}' '${message}'`);
      case "darwin":
        return this.run(`osascript -e 'display notification "${message}" with title "${title}"'`);
      case "win32":
        return this.run(`powershell -command "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $template.GetElementsByTagName('text')[0].AppendChild($template.CreateTextNode('${title}')); $template.GetElementsByTagName('text')[1].AppendChild($template.CreateTextNode('${message}'))"`);
      default:
        throw new Error(`Notifications not supported on ${platform}`);
    }
  }

  // ─── File Operations (Unrestricted) ──────────────────────────────

  static findFiles(pattern: string, dir: string = "."): string {
    return this.run(`find '${dir}' -name '${pattern}' 2>/dev/null | head -50`);
  }

  static diskUsage(path: string = "/"): string {
    return this.run(`df -h '${path}'`);
  }

  static directorySize(path: string): string {
    return this.run(`du -sh '${path}' 2>/dev/null`);
  }

  // ─── Docker ──────────────────────────────────────────────────────

  static dockerAvailable(): boolean {
    try {
      execSync("docker --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  static dockerPs(all: boolean = false): string {
    return this.run(`docker ps ${all ? "-a" : ""} --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"`);
  }

  static dockerRun(image: string, options: Record<string, unknown> = {}): string {
    let cmd = `docker run`;
    if (options.detach) cmd += " -d";
    if (options.name) cmd += ` --name ${options.name}`;
    if (Array.isArray(options.ports)) {
      for (const p of options.ports) cmd += ` -p ${p}`;
    }
    if (Array.isArray(options.volumes)) {
      for (const v of options.volumes) cmd += ` -v ${v}`;
    }
    if (options.env && typeof options.env === "object") {
      for (const [k, v] of Object.entries(options.env as Record<string, string>)) {
        cmd += ` -e ${k}=${v}`;
      }
    }
    cmd += ` ${image}`;
    if (options.command) cmd += ` ${options.command}`;
    return this.run(cmd);
  }

  // ─── Git ─────────────────────────────────────────────────────────

  static gitStatus(repoPath: string = "."): string {
    return this.run(`cd '${repoPath}' && git status`);
  }

  static gitCommit(message: string, files?: string[], repoPath: string = "."): string {
    let cmd = `cd '${repoPath}' && `;
    if (files && files.length > 0) {
      cmd += `git add ${files.join(" ")} && `;
    } else {
      cmd += "git add -A && ";
    }
    cmd += `git commit -m '${message.replace(/'/g, "'\\''")}'`;
    return this.run(cmd);
  }

  // ─── OCR ─────────────────────────────────────────────────────────

  static ocrImage(imagePath: string, language: string = "eng"): string {
    return this.run(`tesseract '${imagePath}' stdout -l ${language} 2>/dev/null`);
  }

  // ─── Helper ──────────────────────────────────────────────────────

  private static run(command: string, timeout: number = 30_000): string {
    try {
      return execSync(command, {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      }).trim();
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message: string };
      if (err.stdout) return err.stdout.trim();
      throw new Error(err.stderr || err.message);
    }
  }
}

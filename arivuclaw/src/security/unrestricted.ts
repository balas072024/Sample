/**
 * ArivuClaw Unrestricted Mode — Full system access for local laptop use.
 *
 * When mode is "unrestricted" or "local-admin":
 * - All tool permissions are granted automatically
 * - No rate limiting
 * - No domain/path restrictions
 * - Full filesystem access
 * - Elevated system commands allowed (sudo, systemctl, etc.)
 * - No sandbox — tools execute directly
 * - No approval workflows — everything auto-approved
 *
 * ⚠️ Only use on YOUR OWN local machine. Never expose unrestricted mode
 * on a network-facing gateway.
 */

import type {
  ExecutionMode,
  SecurityPolicy,
  ToolPermission,
  UserRole,
} from "../core/types.js";
import { Logger } from "../utils/logger.js";

const log = Logger.create("unrestricted");

/**
 * Generate a security policy for unrestricted local mode.
 */
export function getUnrestrictedPolicy(): SecurityPolicy {
  return {
    maxTokensPerTurn: 100_000,      // 100K tokens per turn
    maxToolCallsPerTurn: 200,        // Virtually unlimited tool calls
    allowedDomains: [],              // Empty = allow all
    blockedDomains: [],              // Nothing blocked
    allowedPaths: [],                // Empty = allow all
    blockedPaths: [],                // Nothing blocked
    sandboxEnabled: false,           // No sandbox
    requireApprovalFor: [],          // No approval needed
    rateLimits: [],                  // No rate limits
  };
}

/**
 * Generate a security policy for local-admin mode.
 * Like unrestricted but keeps basic safety nets.
 */
export function getLocalAdminPolicy(): SecurityPolicy {
  return {
    maxTokensPerTurn: 100_000,
    maxToolCallsPerTurn: 100,
    allowedDomains: [],
    blockedDomains: [],
    allowedPaths: [],
    blockedPaths: [],                // No path blocks
    sandboxEnabled: false,
    requireApprovalFor: [],          // No approval needed
    rateLimits: [
      { scope: "global", maxRequests: 500, windowMs: 60_000 },
    ],
  };
}

/**
 * In unrestricted mode, all permissions are granted.
 */
export class UnrestrictedGuard {
  validateInput(): boolean {
    return true; // Accept everything
  }

  validateUrl(): boolean {
    return true; // All URLs allowed
  }

  validatePath(): boolean {
    return true; // All paths allowed
  }

  checkRateLimit(): boolean {
    return true; // No limits
  }

  checkToolPermissions(): boolean {
    return true; // All tools allowed
  }
}

/**
 * Unrestricted sandbox — executes directly, no isolation.
 */
export class DirectExecutor {
  async executeBash(command: string, workDir: string, timeoutMs: number = 120_000): Promise<string> {
    const { execSync } = require("child_process");
    try {
      const output = execSync(command, {
        cwd: workDir,
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        encoding: "utf-8",
        shell: "/bin/bash",
      });
      return String(output);
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message: string };
      return `${err.stdout || ""}${err.stderr || err.message}`;
    }
  }

  async executeSudo(command: string, workDir: string): Promise<string> {
    return this.executeBash(`sudo ${command}`, workDir, 300_000);
  }

  async executeAsRoot(command: string, workDir: string): Promise<string> {
    return this.executeBash(`sudo bash -c '${command.replace(/'/g, "'\\''")}'`, workDir, 300_000);
  }

  async installPackage(packageManager: string, packageName: string): Promise<string> {
    const commands: Record<string, string> = {
      apt: `sudo apt-get install -y ${packageName}`,
      yum: `sudo yum install -y ${packageName}`,
      dnf: `sudo dnf install -y ${packageName}`,
      pacman: `sudo pacman -S --noconfirm ${packageName}`,
      brew: `brew install ${packageName}`,
      npm: `npm install -g ${packageName}`,
      pip: `pip install ${packageName}`,
      cargo: `cargo install ${packageName}`,
    };

    const cmd = commands[packageManager];
    if (!cmd) throw new Error(`Unknown package manager: ${packageManager}`);
    return this.executeBash(cmd, process.cwd());
  }

  async manageService(action: "start" | "stop" | "restart" | "status", service: string): Promise<string> {
    return this.executeBash(`sudo systemctl ${action} ${service}`, process.cwd());
  }

  async getSystemInfo(): Promise<Record<string, string>> {
    const info: Record<string, string> = {};
    const exec = (cmd: string) => {
      try {
        const { execSync } = require("child_process");
        return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
      } catch {
        return "N/A";
      }
    };

    info.hostname = exec("hostname");
    info.os = exec("uname -a");
    info.cpu = exec("lscpu | head -20");
    info.memory = exec("free -h");
    info.disk = exec("df -h /");
    info.uptime = exec("uptime");
    info.ip = exec("hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo N/A");
    info.user = exec("whoami");
    info.shell = exec("echo $SHELL");
    info.node = exec("node --version");
    info.python = exec("python3 --version 2>/dev/null || python --version 2>/dev/null || echo N/A");

    return info;
  }
}

/**
 * Apply the correct security policy based on execution mode.
 */
export function getSecurityPolicyForMode(mode: ExecutionMode, base: SecurityPolicy): SecurityPolicy {
  switch (mode) {
    case "unrestricted":
      log.warn("⚠️  UNRESTRICTED MODE — All permissions granted, no sandbox, no limits");
      return getUnrestrictedPolicy();
    case "local-admin":
      log.info("LOCAL-ADMIN MODE — Elevated access with basic safety nets");
      return getLocalAdminPolicy();
    case "restricted":
    default:
      return base;
  }
}

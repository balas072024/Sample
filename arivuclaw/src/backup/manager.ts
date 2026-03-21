/**
 * Arivumaiyam AI Backup Manager — Export/import config, memory, skills.
 * Gap #22: Backup and restore everything.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Logger } from "../utils/logger";

const log = Logger.create("backup");

export interface BackupManifest {
  version: string;
  date: string;
  stats: { configFiles: number; memoryEntries: number; skills: number; totalSize: number };
}

export class BackupManager {
  constructor(
    private dataDir: string = ".arivuclaw",
    private backupDir: string = ".arivuclaw/backups",
  ) {
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  createBackup(outputPath?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `arivuclaw-backup-${timestamp}.tar.gz`;
    const dest = outputPath || path.join(this.backupDir, backupName);

    const dirs = ["config", "memory", "skills"].filter((d) => fs.existsSync(path.join(this.dataDir, d)));
    const configFiles = ["arivuclaw.config.json", ".arivuclaw/config.json"].filter((f) => fs.existsSync(f));

    const manifest: BackupManifest = {
      version: "1.0.0",
      date: new Date().toISOString(),
      stats: { configFiles: configFiles.length, memoryEntries: 0, skills: 0, totalSize: 0 },
    };

    const manifestPath = path.join(this.dataDir, "backup-manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const sources = [manifestPath, ...configFiles, ...dirs.map((d) => path.join(this.dataDir, d))].filter((s) => fs.existsSync(s));
    execSync(`tar czf '${dest}' ${sources.join(" ")} 2>/dev/null || true`);

    log.info(`Backup created: ${dest}`);
    return dest;
  }

  restoreBackup(backupPath: string): BackupManifest {
    if (!fs.existsSync(backupPath)) throw new Error(`Backup not found: ${backupPath}`);
    execSync(`tar xzf '${backupPath}' 2>/dev/null || true`);
    const manifestPath = path.join(this.dataDir, "backup-manifest.json");
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf-8")) : { version: "unknown", date: "unknown", stats: {} };
    log.info(`Backup restored from: ${backupPath}`);
    return manifest;
  }

  listBackups(): { name: string; date: string; size: number }[] {
    if (!fs.existsSync(this.backupDir)) return [];
    return fs.readdirSync(this.backupDir)
      .filter((f) => f.endsWith(".tar.gz"))
      .map((f) => {
        const p = path.join(this.backupDir, f);
        const stats = fs.statSync(p);
        return { name: f, date: stats.mtime.toISOString(), size: stats.size };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  deleteBackup(name: string): boolean {
    const p = path.join(this.backupDir, name);
    if (fs.existsSync(p)) { fs.unlinkSync(p); return true; }
    return false;
  }
}

"use strict";
/**
 * ArivuClaw Backup Manager — Export/import config, memory, skills.
 * Gap #22: Backup and restore everything.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("backup");
class BackupManager {
    dataDir;
    backupDir;
    constructor(dataDir = ".arivuclaw", backupDir = ".arivuclaw/backups") {
        this.dataDir = dataDir;
        this.backupDir = backupDir;
        fs.mkdirSync(this.backupDir, { recursive: true });
    }
    createBackup(outputPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupName = `arivuclaw-backup-${timestamp}.tar.gz`;
        const dest = outputPath || path.join(this.backupDir, backupName);
        const dirs = ["config", "memory", "skills"].filter((d) => fs.existsSync(path.join(this.dataDir, d)));
        const configFiles = ["arivuclaw.config.json", ".arivuclaw/config.json"].filter((f) => fs.existsSync(f));
        const manifest = {
            version: "1.0.0",
            date: new Date().toISOString(),
            stats: { configFiles: configFiles.length, memoryEntries: 0, skills: 0, totalSize: 0 },
        };
        const manifestPath = path.join(this.dataDir, "backup-manifest.json");
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        const sources = [manifestPath, ...configFiles, ...dirs.map((d) => path.join(this.dataDir, d))].filter((s) => fs.existsSync(s));
        (0, child_process_1.execSync)(`tar czf '${dest}' ${sources.join(" ")} 2>/dev/null || true`);
        log.info(`Backup created: ${dest}`);
        return dest;
    }
    restoreBackup(backupPath) {
        if (!fs.existsSync(backupPath))
            throw new Error(`Backup not found: ${backupPath}`);
        (0, child_process_1.execSync)(`tar xzf '${backupPath}' 2>/dev/null || true`);
        const manifestPath = path.join(this.dataDir, "backup-manifest.json");
        const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf-8")) : { version: "unknown", date: "unknown", stats: {} };
        log.info(`Backup restored from: ${backupPath}`);
        return manifest;
    }
    listBackups() {
        if (!fs.existsSync(this.backupDir))
            return [];
        return fs.readdirSync(this.backupDir)
            .filter((f) => f.endsWith(".tar.gz"))
            .map((f) => {
            const p = path.join(this.backupDir, f);
            const stats = fs.statSync(p);
            return { name: f, date: stats.mtime.toISOString(), size: stats.size };
        })
            .sort((a, b) => b.date.localeCompare(a.date));
    }
    deleteBackup(name) {
        const p = path.join(this.backupDir, name);
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            return true;
        }
        return false;
    }
}
exports.BackupManager = BackupManager;
//# sourceMappingURL=manager.js.map
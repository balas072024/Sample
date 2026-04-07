/**
 * ArivuClaw Backup Manager — Export/import config, memory, skills.
 * Gap #22: Backup and restore everything.
 */
export interface BackupManifest {
    version: string;
    date: string;
    stats: {
        configFiles: number;
        memoryEntries: number;
        skills: number;
        totalSize: number;
    };
}
export declare class BackupManager {
    private dataDir;
    private backupDir;
    constructor(dataDir?: string, backupDir?: string);
    createBackup(outputPath?: string): string;
    restoreBackup(backupPath: string): BackupManifest;
    listBackups(): {
        name: string;
        date: string;
        size: number;
    }[];
    deleteBackup(name: string): boolean;
}
//# sourceMappingURL=manager.d.ts.map
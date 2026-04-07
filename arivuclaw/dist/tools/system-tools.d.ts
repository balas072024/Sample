/**
 * ArivuClaw System Tools — Direct system access for unrestricted/local-admin mode.
 *
 * These tools provide full system control when running on your local laptop.
 */
export declare class SystemTools {
    static getFullSystemInfo(): Record<string, unknown>;
    static getNetworkInterfaces(): Record<string, string[]>;
    static listProcesses(filter?: string): string;
    static killProcess(pid: number, signal?: string): string;
    static detectPackageManager(): string;
    static installPackage(packageName: string, manager?: string): string;
    static manageService(service: string, action: string): string;
    static clipboardRead(): string;
    static clipboardWrite(text: string): void;
    static takeScreenshot(outputPath: string, delay?: number): string;
    static textToSpeech(text: string, outputPath?: string): string;
    static sendNotification(title: string, message: string): string;
    static findFiles(pattern: string, dir?: string): string;
    static diskUsage(path?: string): string;
    static directorySize(path: string): string;
    static dockerAvailable(): boolean;
    static dockerPs(all?: boolean): string;
    static dockerRun(image: string, options?: Record<string, unknown>): string;
    static gitStatus(repoPath?: string): string;
    static gitCommit(message: string, files?: string[], repoPath?: string): string;
    static ocrImage(imagePath: string, language?: string): string;
    private static run;
}
//# sourceMappingURL=system-tools.d.ts.map
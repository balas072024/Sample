/**
 * ArivuClaw Logger — Structured logging utility.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
export declare class Logger {
    private module;
    private constructor();
    static create(module: string): Logger;
    static setLevel(level: LogLevel): void;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    private log;
}
//# sourceMappingURL=logger.d.ts.map
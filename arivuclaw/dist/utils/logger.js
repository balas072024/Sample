"use strict";
/**
 * ArivuClaw Logger — Structured logging utility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
let globalLevel = "info";
class Logger {
    module;
    constructor(module) {
        this.module = module;
    }
    static create(module) {
        return new Logger(module);
    }
    static setLevel(level) {
        globalLevel = level;
    }
    debug(message, ...args) {
        this.log("debug", message, ...args);
    }
    info(message, ...args) {
        this.log("info", message, ...args);
    }
    warn(message, ...args) {
        this.log("warn", message, ...args);
    }
    error(message, ...args) {
        this.log("error", message, ...args);
    }
    log(level, message, ...args) {
        if (LOG_LEVELS[level] < LOG_LEVELS[globalLevel])
            return;
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] [${this.module}]`;
        switch (level) {
            case "debug":
                console.debug(prefix, message, ...args);
                break;
            case "info":
                console.info(prefix, message, ...args);
                break;
            case "warn":
                console.warn(prefix, message, ...args);
                break;
            case "error":
                console.error(prefix, message, ...args);
                break;
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map
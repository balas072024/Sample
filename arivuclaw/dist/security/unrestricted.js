"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectExecutor = exports.UnrestrictedGuard = void 0;
exports.getUnrestrictedPolicy = getUnrestrictedPolicy;
exports.getLocalAdminPolicy = getLocalAdminPolicy;
exports.getSecurityPolicyForMode = getSecurityPolicyForMode;
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("unrestricted");
/**
 * Generate a security policy for unrestricted local mode.
 */
function getUnrestrictedPolicy() {
    return {
        maxTokensPerTurn: 100_000, // 100K tokens per turn
        maxToolCallsPerTurn: 200, // Virtually unlimited tool calls
        allowedDomains: [], // Empty = allow all
        blockedDomains: [], // Nothing blocked
        allowedPaths: [], // Empty = allow all
        blockedPaths: [], // Nothing blocked
        sandboxEnabled: false, // No sandbox
        requireApprovalFor: [], // No approval needed
        rateLimits: [], // No rate limits
    };
}
/**
 * Generate a security policy for local-admin mode.
 * Like unrestricted but keeps basic safety nets.
 */
function getLocalAdminPolicy() {
    return {
        maxTokensPerTurn: 100_000,
        maxToolCallsPerTurn: 100,
        allowedDomains: [],
        blockedDomains: [],
        allowedPaths: [],
        blockedPaths: [], // No path blocks
        sandboxEnabled: false,
        requireApprovalFor: [], // No approval needed
        rateLimits: [
            { scope: "global", maxRequests: 500, windowMs: 60_000 },
        ],
    };
}
/**
 * In unrestricted mode, all permissions are granted.
 */
class UnrestrictedGuard {
    validateInput() {
        return true; // Accept everything
    }
    validateUrl() {
        return true; // All URLs allowed
    }
    validatePath() {
        return true; // All paths allowed
    }
    checkRateLimit() {
        return true; // No limits
    }
    checkToolPermissions() {
        return true; // All tools allowed
    }
}
exports.UnrestrictedGuard = UnrestrictedGuard;
/**
 * Unrestricted sandbox — executes directly, no isolation.
 */
class DirectExecutor {
    async executeBash(command, workDir, timeoutMs = 120_000) {
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
        }
        catch (error) {
            const err = error;
            return `${err.stdout || ""}${err.stderr || err.message}`;
        }
    }
    async executeSudo(command, workDir) {
        return this.executeBash(`sudo ${command}`, workDir, 300_000);
    }
    async executeAsRoot(command, workDir) {
        return this.executeBash(`sudo bash -c '${command.replace(/'/g, "'\\''")}'`, workDir, 300_000);
    }
    async installPackage(packageManager, packageName) {
        const commands = {
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
        if (!cmd)
            throw new Error(`Unknown package manager: ${packageManager}`);
        return this.executeBash(cmd, process.cwd());
    }
    async manageService(action, service) {
        return this.executeBash(`sudo systemctl ${action} ${service}`, process.cwd());
    }
    async getSystemInfo() {
        const info = {};
        const exec = (cmd) => {
            try {
                const { execSync } = require("child_process");
                return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
            }
            catch {
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
exports.DirectExecutor = DirectExecutor;
/**
 * Apply the correct security policy based on execution mode.
 */
function getSecurityPolicyForMode(mode, base) {
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
//# sourceMappingURL=unrestricted.js.map
"use strict";
/**
 * ArivuClaw Container Sandbox — Docker-based isolation for skill execution.
 *
 * Runs tools and skills inside Docker containers with strict resource limits.
 * Falls back to in-process execution when Docker is not available.
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
exports.ContainerSandbox = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("container-sandbox");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const DEFAULT_LIMITS = {
    cpuShares: 512,
    memoryMb: 256,
    networkEnabled: false,
    readOnlyFs: true,
    tmpSizeMb: 64,
    pidsLimit: 64,
};
// ─── ContainerSandbox ────────────────────────────────────────────────
class ContainerSandbox {
    dockerAvailable = null;
    activeContainers = new Map();
    containerPrefix = "arivuclaw-sandbox";
    /**
     * Check whether Docker daemon is reachable.
     */
    async isDockerAvailable() {
        if (this.dockerAvailable !== null)
            return this.dockerAvailable;
        try {
            await execFileAsync("docker", ["info"], { timeout: 5_000 });
            this.dockerAvailable = true;
            log.info("Docker daemon is available");
        }
        catch {
            this.dockerAvailable = false;
            log.warn("Docker not available — falling back to in-process execution");
        }
        return this.dockerAvailable;
    }
    /**
     * Execute a command inside an isolated Docker container.
     */
    async executeInContainer(image, command, timeout = 30_000, memoryLimit = 256, networkEnabled = false) {
        const start = Date.now();
        const available = await this.isDockerAvailable();
        if (!available) {
            return this.executeInProcess(command, timeout, start);
        }
        const limits = {
            ...DEFAULT_LIMITS,
            memoryMb: memoryLimit,
            networkEnabled,
        };
        const containerName = `${this.containerPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const dockerArgs = this.buildDockerArgs(image, command, containerName, limits, timeout);
        try {
            log.debug("Starting container", { containerName, image, command });
            const info = {
                id: containerName,
                image,
                createdAt: new Date(),
                status: "running",
            };
            this.activeContainers.set(containerName, info);
            const { stdout, stderr } = await execFileAsync("docker", dockerArgs, {
                timeout: timeout + 5_000, // grace period beyond container timeout
                maxBuffer: 10 * 1024 * 1024,
            });
            const durationMs = Date.now() - start;
            info.status = "stopped";
            log.info("Container execution completed", { containerName, durationMs });
            // Cleanup container
            this.removeContainer(containerName).catch(() => { });
            return {
                exitCode: 0,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                durationMs,
                containerId: containerName,
                fallback: false,
            };
        }
        catch (error) {
            const durationMs = Date.now() - start;
            const err = error;
            if (err.killed) {
                log.warn("Container timed out", { containerName, timeout });
            }
            else {
                log.error("Container execution failed", { containerName, error: String(error) });
            }
            // Force-remove on failure
            this.removeContainer(containerName).catch(() => { });
            return {
                exitCode: err.code ?? 1,
                stdout: (err.stdout ?? "").trim(),
                stderr: (err.stderr ?? String(error)).trim(),
                durationMs,
                containerId: containerName,
                fallback: false,
            };
        }
    }
    /**
     * Build a Docker image for a skill directory.
     */
    async buildSkillContainer(skillDir) {
        const available = await this.isDockerAvailable();
        if (!available) {
            throw new Error("Docker is not available — cannot build skill container");
        }
        const dockerfilePath = path.join(skillDir, "Dockerfile");
        const hasDockerfile = fs.existsSync(dockerfilePath);
        const imageName = `${this.containerPrefix}-skill-${path.basename(skillDir)}`.toLowerCase();
        if (!hasDockerfile) {
            log.info("No Dockerfile found, generating default for skill", { skillDir });
            const defaultDockerfile = this.generateDefaultDockerfile(skillDir);
            fs.writeFileSync(dockerfilePath, defaultDockerfile, "utf-8");
        }
        try {
            log.info("Building skill container image", { imageName, skillDir });
            await execFileAsync("docker", ["build", "-t", imageName, skillDir], {
                timeout: 120_000,
                maxBuffer: 50 * 1024 * 1024,
            });
            log.info("Skill container built successfully", { imageName });
            return imageName;
        }
        catch (error) {
            log.error("Failed to build skill container", { skillDir, error: String(error) });
            throw new Error(`Failed to build container for skill at ${skillDir}: ${error}`);
        }
    }
    /**
     * Clean up all active containers and dangling images.
     */
    async cleanup() {
        log.info("Cleaning up sandbox containers...");
        const removePromises = [];
        for (const [name, info] of this.activeContainers.entries()) {
            if (info.status !== "removed") {
                removePromises.push(this.removeContainer(name));
            }
        }
        await Promise.allSettled(removePromises);
        this.activeContainers.clear();
        // Remove dangling containers with our prefix
        try {
            const { stdout } = await execFileAsync("docker", [
                "ps", "-a", "--filter", `name=${this.containerPrefix}`, "--format", "{{.Names}}",
            ], { timeout: 10_000 });
            const staleContainers = stdout.trim().split("\n").filter(Boolean);
            for (const name of staleContainers) {
                await this.removeContainer(name);
            }
            if (staleContainers.length > 0) {
                log.info(`Removed ${staleContainers.length} stale sandbox container(s)`);
            }
        }
        catch {
            log.debug("No stale containers to clean up");
        }
        log.info("Sandbox cleanup complete");
    }
    // ─── Private helpers ──────────────────────────────────────────────
    buildDockerArgs(image, command, containerName, limits, timeoutMs) {
        const args = [
            "run",
            "--rm",
            "--name", containerName,
            // Resource limits
            "--memory", `${limits.memoryMb}m`,
            "--memory-swap", `${limits.memoryMb}m`, // disable swap
            "--cpu-shares", String(limits.cpuShares ?? DEFAULT_LIMITS.cpuShares),
            "--pids-limit", String(limits.pidsLimit ?? DEFAULT_LIMITS.pidsLimit),
            // Security
            "--security-opt", "no-new-privileges",
            "--cap-drop", "ALL",
            // Timeout via stop-timeout (container-level)
            "--stop-timeout", String(Math.ceil(timeoutMs / 1000)),
        ];
        if (!limits.networkEnabled) {
            args.push("--network", "none");
        }
        if (limits.readOnlyFs) {
            args.push("--read-only");
            // Provide a writable /tmp
            const tmpSize = limits.tmpSizeMb ?? DEFAULT_LIMITS.tmpSizeMb;
            args.push("--tmpfs", `/tmp:rw,noexec,nosuid,size=${tmpSize}m`);
        }
        args.push(image, ...command);
        return args;
    }
    /**
     * Fallback execution: run the command directly in-process with a timeout.
     */
    async executeInProcess(command, timeout, startTime) {
        log.warn("Executing in-process (no Docker isolation)", { command });
        return new Promise((resolve) => {
            const [cmd, ...args] = command;
            let stdout = "";
            let stderr = "";
            const proc = (0, child_process_1.spawn)(cmd, args, {
                timeout,
                stdio: ["ignore", "pipe", "pipe"],
                env: { ...process.env, NODE_ENV: "sandbox" },
            });
            proc.stdout.on("data", (chunk) => {
                stdout += chunk.toString();
            });
            proc.stderr.on("data", (chunk) => {
                stderr += chunk.toString();
            });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    durationMs: Date.now() - startTime,
                    fallback: true,
                });
            });
            proc.on("error", (err) => {
                resolve({
                    exitCode: 1,
                    stdout: "",
                    stderr: err.message,
                    durationMs: Date.now() - startTime,
                    fallback: true,
                });
            });
        });
    }
    async removeContainer(name) {
        try {
            await execFileAsync("docker", ["rm", "-f", name], { timeout: 10_000 });
            const info = this.activeContainers.get(name);
            if (info)
                info.status = "removed";
        }
        catch {
            // container may already be removed
        }
    }
    generateDefaultDockerfile(skillDir) {
        const hasPackageJson = fs.existsSync(path.join(skillDir, "package.json"));
        if (hasPackageJson) {
            return [
                "FROM node:20-slim",
                "WORKDIR /skill",
                "COPY package*.json ./",
                "RUN npm ci --production 2>/dev/null || npm install --production",
                "COPY . .",
                'ENTRYPOINT ["node"]',
            ].join("\n");
        }
        return [
            "FROM node:20-slim",
            "WORKDIR /skill",
            "COPY . .",
            'ENTRYPOINT ["node"]',
        ].join("\n");
    }
}
exports.ContainerSandbox = ContainerSandbox;
//# sourceMappingURL=container-sandbox.js.map
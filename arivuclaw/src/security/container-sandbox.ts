/**
 * ArivuClaw Container Sandbox — Docker-based isolation for skill execution.
 *
 * Runs tools and skills inside Docker containers with strict resource limits.
 * Falls back to in-process execution when Docker is not available.
 */

import { execFile, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { Logger } from "../utils/logger.js";

const log = Logger.create("container-sandbox");
const execFileAsync = promisify(execFile);

// ─── Types ───────────────────────────────────────────────────────────

export interface ContainerExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  containerId?: string;
  fallback: boolean;
}

export interface ResourceLimits {
  cpuShares?: number;
  memoryMb: number;
  networkEnabled: boolean;
  readOnlyFs?: boolean;
  tmpSizeMb?: number;
  pidsLimit?: number;
}

interface ContainerInfo {
  id: string;
  image: string;
  createdAt: Date;
  status: "running" | "stopped" | "removed";
}

const DEFAULT_LIMITS: ResourceLimits = {
  cpuShares: 512,
  memoryMb: 256,
  networkEnabled: false,
  readOnlyFs: true,
  tmpSizeMb: 64,
  pidsLimit: 64,
};

// ─── ContainerSandbox ────────────────────────────────────────────────

export class ContainerSandbox {
  private dockerAvailable: boolean | null = null;
  private activeContainers: Map<string, ContainerInfo> = new Map();
  private containerPrefix = "arivuclaw-sandbox";

  /**
   * Check whether Docker daemon is reachable.
   */
  async isDockerAvailable(): Promise<boolean> {
    if (this.dockerAvailable !== null) return this.dockerAvailable;

    try {
      await execFileAsync("docker", ["info"], { timeout: 5_000 });
      this.dockerAvailable = true;
      log.info("Docker daemon is available");
    } catch {
      this.dockerAvailable = false;
      log.warn("Docker not available — falling back to in-process execution");
    }
    return this.dockerAvailable;
  }

  /**
   * Execute a command inside an isolated Docker container.
   */
  async executeInContainer(
    image: string,
    command: string[],
    timeout: number = 30_000,
    memoryLimit: number = 256,
    networkEnabled: boolean = false,
  ): Promise<ContainerExecutionResult> {
    const start = Date.now();
    const available = await this.isDockerAvailable();

    if (!available) {
      return this.executeInProcess(command, timeout, start);
    }

    const limits: ResourceLimits = {
      ...DEFAULT_LIMITS,
      memoryMb: memoryLimit,
      networkEnabled,
    };

    const containerName = `${this.containerPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const dockerArgs = this.buildDockerArgs(image, command, containerName, limits, timeout);

    try {
      log.debug("Starting container", { containerName, image, command });

      const info: ContainerInfo = {
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
      this.removeContainer(containerName).catch(() => {});

      return {
        exitCode: 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        durationMs,
        containerId: containerName,
        fallback: false,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - start;
      const err = error as { code?: number; stdout?: string; stderr?: string; killed?: boolean };

      if (err.killed) {
        log.warn("Container timed out", { containerName, timeout });
      } else {
        log.error("Container execution failed", { containerName, error: String(error) });
      }

      // Force-remove on failure
      this.removeContainer(containerName).catch(() => {});

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
  async buildSkillContainer(skillDir: string): Promise<string> {
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
    } catch (error) {
      log.error("Failed to build skill container", { skillDir, error: String(error) });
      throw new Error(`Failed to build container for skill at ${skillDir}: ${error}`);
    }
  }

  /**
   * Clean up all active containers and dangling images.
   */
  async cleanup(): Promise<void> {
    log.info("Cleaning up sandbox containers...");

    const removePromises: Promise<void>[] = [];

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
    } catch {
      log.debug("No stale containers to clean up");
    }

    log.info("Sandbox cleanup complete");
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private buildDockerArgs(
    image: string,
    command: string[],
    containerName: string,
    limits: ResourceLimits,
    timeoutMs: number,
  ): string[] {
    const args: string[] = [
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
  private async executeInProcess(
    command: string[],
    timeout: number,
    startTime: number,
  ): Promise<ContainerExecutionResult> {
    log.warn("Executing in-process (no Docker isolation)", { command });

    return new Promise<ContainerExecutionResult>((resolve) => {
      const [cmd, ...args] = command;
      let stdout = "";
      let stderr = "";

      const proc = spawn(cmd, args, {
        timeout,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, NODE_ENV: "sandbox" },
      });

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk: Buffer) => {
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

  private async removeContainer(name: string): Promise<void> {
    try {
      await execFileAsync("docker", ["rm", "-f", name], { timeout: 10_000 });
      const info = this.activeContainers.get(name);
      if (info) info.status = "removed";
    } catch {
      // container may already be removed
    }
  }

  private generateDefaultDockerfile(skillDir: string): string {
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

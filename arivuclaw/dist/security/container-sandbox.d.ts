/**
 * ArivuClaw Container Sandbox — Docker-based isolation for skill execution.
 *
 * Runs tools and skills inside Docker containers with strict resource limits.
 * Falls back to in-process execution when Docker is not available.
 */
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
export declare class ContainerSandbox {
    private dockerAvailable;
    private activeContainers;
    private containerPrefix;
    /**
     * Check whether Docker daemon is reachable.
     */
    isDockerAvailable(): Promise<boolean>;
    /**
     * Execute a command inside an isolated Docker container.
     */
    executeInContainer(image: string, command: string[], timeout?: number, memoryLimit?: number, networkEnabled?: boolean): Promise<ContainerExecutionResult>;
    /**
     * Build a Docker image for a skill directory.
     */
    buildSkillContainer(skillDir: string): Promise<string>;
    /**
     * Clean up all active containers and dangling images.
     */
    cleanup(): Promise<void>;
    private buildDockerArgs;
    /**
     * Fallback execution: run the command directly in-process with a timeout.
     */
    private executeInProcess;
    private removeContainer;
    private generateDefaultDockerfile;
}
//# sourceMappingURL=container-sandbox.d.ts.map
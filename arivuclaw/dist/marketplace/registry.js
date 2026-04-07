"use strict";
/**
 * ArivuClaw Skill Marketplace — Client for searching, installing, and
 * publishing skills from a central registry.
 *
 * Skills are distributed as tarballs containing a manifest and source files.
 * Installed skills are extracted to `~/.arivuclaw/skills/<name>/`.
 *
 * Includes a SkillVerifier that validates SHA-256 checksums and can
 * optionally check hashes against a threat-intelligence service.
 *
 * @module marketplace/registry
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
exports.MarketplaceClient = exports.SkillVerifier = void 0;
const logger_1 = require("../utils/logger");
// ─── Skill Verifier ──────────────────────────────────────────────────
/**
 * Verifies skill package integrity by checking SHA-256 checksums and
 * optionally querying a VirusTotal-style threat intelligence API.
 *
 * @example
 * ```ts
 * const verifier = new SkillVerifier();
 * const result = await verifier.verify(tarballBuffer, "abc123...");
 * if (!result.valid) throw new Error("Skill verification failed");
 * ```
 */
class SkillVerifier {
    log = logger_1.Logger.create("SkillVerifier");
    threatApiUrl = null;
    /**
     * Optionally configure a threat intelligence API endpoint.
     *
     * @param url - Base URL for the hash-lookup API (e.g. VirusTotal compatible).
     */
    setThreatApiUrl(url) {
        this.threatApiUrl = url;
    }
    /**
     * Verify the integrity and safety of a downloaded skill package.
     *
     * @param data - The raw tarball buffer.
     * @param expectedHash - The SHA-256 hash advertised by the registry.
     * @returns Verification result.
     */
    async verify(data, expectedHash) {
        const crypto = await Promise.resolve().then(() => __importStar(require("node:crypto")));
        const computedHash = crypto.createHash("sha256").update(data).digest("hex");
        const messages = [];
        let valid = true;
        // Check hash match
        if (computedHash !== expectedHash) {
            valid = false;
            messages.push(`Checksum mismatch: expected ${expectedHash}, got ${computedHash}`);
            this.log.error(messages[messages.length - 1]);
        }
        else {
            messages.push("Checksum verified");
        }
        // Threat intelligence check
        let threatChecked = false;
        let threatDetected = false;
        if (this.threatApiUrl) {
            try {
                const response = await fetch(`${this.threatApiUrl}/hash/${computedHash}`);
                if (response.ok) {
                    const result = (await response.json());
                    threatChecked = true;
                    threatDetected = result.malicious;
                    if (threatDetected) {
                        valid = false;
                        messages.push("THREAT DETECTED: hash flagged by threat intelligence");
                        this.log.error(messages[messages.length - 1]);
                    }
                    else {
                        messages.push("Threat check passed");
                    }
                }
            }
            catch (error) {
                messages.push(`Threat check unavailable: ${error}`);
                this.log.warn(messages[messages.length - 1]);
            }
        }
        else {
            messages.push("Threat check skipped (no API configured)");
        }
        return {
            valid,
            computedHash,
            expectedHash,
            threatChecked,
            threatDetected,
            messages,
        };
    }
}
exports.SkillVerifier = SkillVerifier;
// ─── Marketplace Client ──────────────────────────────────────────────
/**
 * Client for the ArivuClaw Skill Marketplace.
 *
 * Provides methods to search, install, publish, update, and manage
 * skills from a central registry.
 *
 * @example
 * ```ts
 * const client = new MarketplaceClient();
 * const results = await client.searchSkills("weather", ["utility"]);
 * await client.installSkill("arivuclaw-skill-weather", "1.0.0");
 * ```
 */
class MarketplaceClient {
    log = logger_1.Logger.create("MarketplaceClient");
    config;
    verifier;
    installed = new Map();
    /**
     * Create a new MarketplaceClient.
     *
     * @param config - Optional configuration overrides.
     */
    constructor(config = {}) {
        this.config = {
            registryUrl: config.registryUrl ?? "https://registry.arivuclaw.dev",
            skillsDir: config.skillsDir ?? this.getDefaultSkillsDir(),
            verifyChecksums: config.verifyChecksums ?? true,
            apiKey: config.apiKey,
        };
        this.verifier = new SkillVerifier();
    }
    /**
     * Search the registry for skills matching a query and/or tags.
     *
     * @param query - Free-text search query.
     * @param tags - Optional tags to filter by.
     * @returns Search results from the registry.
     */
    async searchSkills(query, tags = []) {
        const params = new URLSearchParams({ q: query });
        if (tags.length > 0) {
            params.set("tags", tags.join(","));
        }
        const url = `${this.config.registryUrl}/api/v1/skills/search?${params}`;
        this.log.info(`Searching registry: ${query} [${tags.join(", ")}]`);
        const response = await this.registryFetch(url);
        return (await response.json());
    }
    /**
     * Install a skill from the registry.
     *
     * @param name - Skill name.
     * @param version - Version to install (default: "latest").
     * @returns The installed skill metadata.
     */
    async installSkill(name, version = "latest") {
        this.log.info(`Installing skill: ${name}@${version}`);
        // Fetch skill info
        const info = await this.getSkillInfo(name);
        const targetVersion = version === "latest" ? info.version : version;
        const tarballUrl = info.tarballUrl;
        // Download tarball
        this.log.debug(`Downloading: ${tarballUrl}`);
        const tarballResponse = await fetch(tarballUrl);
        if (!tarballResponse.ok) {
            throw new Error(`Failed to download skill tarball: ${tarballResponse.status}`);
        }
        const tarballBuffer = Buffer.from(await tarballResponse.arrayBuffer());
        // Verify checksum
        if (this.config.verifyChecksums) {
            const verification = await this.verifier.verify(tarballBuffer, info.sha256);
            if (!verification.valid) {
                throw new Error(`Skill verification failed: ${verification.messages.join("; ")}`);
            }
            this.log.info(`Verification passed: ${verification.messages.join("; ")}`);
        }
        // Extract to skills directory
        const { mkdir, writeFile } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        const skillDir = join(this.config.skillsDir, name);
        await mkdir(skillDir, { recursive: true });
        // Extract tarball (simplified — real impl would use tar.extract)
        await this.extractTarball(tarballBuffer, skillDir);
        // Read manifest
        const manifestPath = join(skillDir, "manifest.json");
        let manifest;
        try {
            const { readFile } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
            const manifestData = await readFile(manifestPath, "utf-8");
            manifest = JSON.parse(manifestData);
        }
        catch {
            manifest = {
                name,
                version: targetVersion,
                description: info.description,
                author: info.author,
                permissions: [],
                tools: [],
            };
            await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        }
        const installedSkill = {
            name,
            version: targetVersion,
            path: skillDir,
            installedAt: new Date(),
            manifest,
        };
        this.installed.set(name, installedSkill);
        this.log.info(`Skill installed: ${name}@${targetVersion} at ${skillDir}`);
        return installedSkill;
    }
    /**
     * Publish a skill directory to the registry.
     *
     * @param skillDir - Absolute path to the skill source directory.
     * @returns The published skill info from the registry.
     */
    async publishSkill(skillDir) {
        this.log.info(`Publishing skill from: ${skillDir}`);
        const { readFile } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        // Read manifest
        const manifestPath = join(skillDir, "manifest.json");
        const manifestData = await readFile(manifestPath, "utf-8");
        const manifest = JSON.parse(manifestData);
        // Create tarball (simplified)
        const tarball = await this.createTarball(skillDir);
        // Compute checksum
        const crypto = await Promise.resolve().then(() => __importStar(require("node:crypto")));
        const sha256 = crypto.createHash("sha256").update(tarball).digest("hex");
        // Upload to registry
        const url = `${this.config.registryUrl}/api/v1/skills/publish`;
        const formData = new FormData();
        formData.append("manifest", manifestData);
        formData.append("sha256", sha256);
        formData.append("tarball", new Blob([tarball], { type: "application/gzip" }), `${manifest.name}-${manifest.version}.tar.gz`);
        const response = await this.registryFetch(url, {
            method: "POST",
            body: formData,
        });
        const result = (await response.json());
        this.log.info(`Skill published: ${manifest.name}@${manifest.version}`);
        return result;
    }
    /**
     * List all locally installed skills.
     *
     * @returns Array of installed skill records.
     */
    async listInstalled() {
        // If the in-memory map is empty, scan the skills directory
        if (this.installed.size === 0) {
            await this.scanInstalledSkills();
        }
        return Array.from(this.installed.values());
    }
    /**
     * Update an installed skill to the latest version.
     *
     * @param name - Skill name to update.
     * @returns The updated installed skill.
     */
    async updateSkill(name) {
        this.log.info(`Updating skill: ${name}`);
        const current = this.installed.get(name);
        if (!current) {
            throw new Error(`Skill "${name}" is not installed`);
        }
        const info = await this.getSkillInfo(name);
        if (info.version === current.version) {
            this.log.info(`Skill "${name}" is already at the latest version (${info.version})`);
            return current;
        }
        // Remove old version and install new
        await this.removeSkill(name);
        return this.installSkill(name, info.version);
    }
    /**
     * Remove an installed skill.
     *
     * @param name - Skill name to remove.
     */
    async removeSkill(name) {
        const skill = this.installed.get(name);
        if (!skill) {
            throw new Error(`Skill "${name}" is not installed`);
        }
        const { rm } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        await rm(skill.path, { recursive: true, force: true });
        this.installed.delete(name);
        this.log.info(`Skill removed: ${name}`);
    }
    /**
     * Get detailed information about a skill from the registry.
     *
     * @param name - Skill name.
     * @returns Skill info from the registry.
     */
    async getSkillInfo(name) {
        const url = `${this.config.registryUrl}/api/v1/skills/${encodeURIComponent(name)}`;
        const response = await this.registryFetch(url);
        if (!response.ok) {
            throw new Error(`Skill "${name}" not found in registry (${response.status})`);
        }
        return (await response.json());
    }
    /**
     * Get the SkillVerifier instance for custom verification workflows.
     */
    getVerifier() {
        return this.verifier;
    }
    /** Make an authenticated request to the registry. */
    async registryFetch(url, init) {
        const headers = {
            ...init?.headers,
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }
        const response = await fetch(url, { ...init, headers });
        if (!response.ok) {
            throw new Error(`Registry request failed: ${response.status} ${response.statusText} (${url})`);
        }
        return response;
    }
    /** Get the default skills directory (~/.arivuclaw/skills/). */
    getDefaultSkillsDir() {
        const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "/tmp";
        return `${home}/.arivuclaw/skills`;
    }
    /** Scan the skills directory for already-installed skills. */
    async scanInstalledSkills() {
        const { readdir, readFile, stat } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        try {
            const entries = await readdir(this.config.skillsDir);
            for (const entry of entries) {
                const skillDir = join(this.config.skillsDir, entry);
                const info = await stat(skillDir);
                if (!info.isDirectory())
                    continue;
                try {
                    const manifestPath = join(skillDir, "manifest.json");
                    const manifestData = await readFile(manifestPath, "utf-8");
                    const manifest = JSON.parse(manifestData);
                    this.installed.set(manifest.name, {
                        name: manifest.name,
                        version: manifest.version,
                        path: skillDir,
                        installedAt: info.mtime,
                        manifest,
                    });
                }
                catch {
                    this.log.warn(`Skipping invalid skill directory: ${skillDir}`);
                }
            }
        }
        catch {
            this.log.debug(`Skills directory not found: ${this.config.skillsDir}`);
        }
    }
    /**
     * Extract a tarball buffer to a target directory.
     * Simplified implementation — a production system would use the `tar` package.
     */
    async extractTarball(data, targetDir) {
        const { writeFile } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        // Store the raw tarball for potential re-extraction with proper tooling
        await writeFile(join(targetDir, "_package.tar.gz"), data);
        this.log.debug(`Tarball saved to ${targetDir}/_package.tar.gz`);
        // In a production implementation, this would use:
        // const tar = await import("tar");
        // await tar.extract({ file: tarballPath, cwd: targetDir });
    }
    /**
     * Create a tarball from a skill directory.
     * Simplified implementation — a production system would use the `tar` package.
     */
    async createTarball(skillDir) {
        const { readFile } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        // Simplified: just bundle the manifest as a proof of concept.
        // A real implementation would tar the entire directory.
        const manifestData = await readFile(join(skillDir, "manifest.json"));
        return manifestData;
    }
}
exports.MarketplaceClient = MarketplaceClient;
//# sourceMappingURL=registry.js.map
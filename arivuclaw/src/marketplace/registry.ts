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

import type { SkillManifest } from "../core/types";
import { Logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

/** Metadata returned from the registry for a published skill. */
export interface RegistrySkillInfo {
  /** Skill name. */
  name: string;
  /** Latest version. */
  version: string;
  /** Description. */
  description: string;
  /** Author name or email. */
  author: string;
  /** Discovery tags. */
  tags: string[];
  /** Number of installs. */
  downloads: number;
  /** Average rating (0-5). */
  rating: number;
  /** URL to the tarball. */
  tarballUrl: string;
  /** SHA-256 checksum of the tarball. */
  sha256: string;
  /** Signature for verification. */
  signature?: string;
  /** Publication timestamp. */
  publishedAt: string;
  /** All available versions. */
  versions: string[];
}

/** Search result from the registry. */
export interface RegistrySearchResult {
  /** Total matching skills. */
  total: number;
  /** Page of results. */
  results: RegistrySkillInfo[];
}

/** Result of verifying a skill package. */
export interface VerificationResult {
  /** Whether the verification passed. */
  valid: boolean;
  /** SHA-256 hash of the downloaded package. */
  computedHash: string;
  /** Expected SHA-256 hash from the registry. */
  expectedHash: string;
  /** Whether the hash was checked against a threat intelligence service. */
  threatChecked: boolean;
  /** Whether the hash was found in a threat database. */
  threatDetected: boolean;
  /** Human-readable status messages. */
  messages: string[];
}

/** Record of an installed skill on the local system. */
export interface InstalledSkill {
  /** Skill name. */
  name: string;
  /** Installed version. */
  version: string;
  /** Local filesystem path to the skill directory. */
  path: string;
  /** Timestamp when the skill was installed. */
  installedAt: Date;
  /** Skill manifest data. */
  manifest: SkillManifest;
}

/** Configuration for the marketplace client. */
export interface MarketplaceConfig {
  /** Registry base URL. */
  registryUrl: string;
  /** Local directory for installed skills. */
  skillsDir: string;
  /** Whether to verify checksums on install (default: true). */
  verifyChecksums: boolean;
  /** Optional API key for authenticated registry access. */
  apiKey?: string;
}

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
export class SkillVerifier {
  private readonly log = Logger.create("SkillVerifier");
  private threatApiUrl: string | null = null;

  /**
   * Optionally configure a threat intelligence API endpoint.
   *
   * @param url - Base URL for the hash-lookup API (e.g. VirusTotal compatible).
   */
  setThreatApiUrl(url: string): void {
    this.threatApiUrl = url;
  }

  /**
   * Verify the integrity and safety of a downloaded skill package.
   *
   * @param data - The raw tarball buffer.
   * @param expectedHash - The SHA-256 hash advertised by the registry.
   * @returns Verification result.
   */
  async verify(data: Buffer, expectedHash: string): Promise<VerificationResult> {
    const crypto = await import("node:crypto");
    const computedHash = crypto.createHash("sha256").update(data).digest("hex");

    const messages: string[] = [];
    let valid = true;

    // Check hash match
    if (computedHash !== expectedHash) {
      valid = false;
      messages.push(
        `Checksum mismatch: expected ${expectedHash}, got ${computedHash}`,
      );
      this.log.error(messages[messages.length - 1]);
    } else {
      messages.push("Checksum verified");
    }

    // Threat intelligence check
    let threatChecked = false;
    let threatDetected = false;

    if (this.threatApiUrl) {
      try {
        const response = await fetch(
          `${this.threatApiUrl}/hash/${computedHash}`,
        );

        if (response.ok) {
          const result = (await response.json()) as { malicious: boolean };
          threatChecked = true;
          threatDetected = result.malicious;

          if (threatDetected) {
            valid = false;
            messages.push("THREAT DETECTED: hash flagged by threat intelligence");
            this.log.error(messages[messages.length - 1]);
          } else {
            messages.push("Threat check passed");
          }
        }
      } catch (error) {
        messages.push(`Threat check unavailable: ${error}`);
        this.log.warn(messages[messages.length - 1]);
      }
    } else {
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
export class MarketplaceClient {
  private readonly log = Logger.create("MarketplaceClient");
  private readonly config: MarketplaceConfig;
  private readonly verifier: SkillVerifier;
  private readonly installed = new Map<string, InstalledSkill>();

  /**
   * Create a new MarketplaceClient.
   *
   * @param config - Optional configuration overrides.
   */
  constructor(config: Partial<MarketplaceConfig> = {}) {
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
  async searchSkills(
    query: string,
    tags: string[] = [],
  ): Promise<RegistrySearchResult> {
    const params = new URLSearchParams({ q: query });
    if (tags.length > 0) {
      params.set("tags", tags.join(","));
    }

    const url = `${this.config.registryUrl}/api/v1/skills/search?${params}`;
    this.log.info(`Searching registry: ${query} [${tags.join(", ")}]`);

    const response = await this.registryFetch(url);
    return (await response.json()) as RegistrySearchResult;
  }

  /**
   * Install a skill from the registry.
   *
   * @param name - Skill name.
   * @param version - Version to install (default: "latest").
   * @returns The installed skill metadata.
   */
  async installSkill(
    name: string,
    version: string = "latest",
  ): Promise<InstalledSkill> {
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
        throw new Error(
          `Skill verification failed: ${verification.messages.join("; ")}`,
        );
      }
      this.log.info(`Verification passed: ${verification.messages.join("; ")}`);
    }

    // Extract to skills directory
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const skillDir = join(this.config.skillsDir, name);
    await mkdir(skillDir, { recursive: true });

    // Extract tarball (simplified — real impl would use tar.extract)
    await this.extractTarball(tarballBuffer, skillDir);

    // Read manifest
    const manifestPath = join(skillDir, "manifest.json");
    let manifest: SkillManifest;
    try {
      const { readFile } = await import("node:fs/promises");
      const manifestData = await readFile(manifestPath, "utf-8");
      manifest = JSON.parse(manifestData) as SkillManifest;
    } catch {
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

    const installedSkill: InstalledSkill = {
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
  async publishSkill(skillDir: string): Promise<RegistrySkillInfo> {
    this.log.info(`Publishing skill from: ${skillDir}`);

    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    // Read manifest
    const manifestPath = join(skillDir, "manifest.json");
    const manifestData = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestData) as SkillManifest;

    // Create tarball (simplified)
    const tarball = await this.createTarball(skillDir);

    // Compute checksum
    const crypto = await import("node:crypto");
    const sha256 = crypto.createHash("sha256").update(tarball).digest("hex");

    // Upload to registry
    const url = `${this.config.registryUrl}/api/v1/skills/publish`;
    const formData = new FormData();
    formData.append("manifest", manifestData);
    formData.append("sha256", sha256);
    formData.append(
      "tarball",
      new Blob([tarball], { type: "application/gzip" }),
      `${manifest.name}-${manifest.version}.tar.gz`,
    );

    const response = await this.registryFetch(url, {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as RegistrySkillInfo;
    this.log.info(`Skill published: ${manifest.name}@${manifest.version}`);
    return result;
  }

  /**
   * List all locally installed skills.
   *
   * @returns Array of installed skill records.
   */
  async listInstalled(): Promise<InstalledSkill[]> {
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
  async updateSkill(name: string): Promise<InstalledSkill> {
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
  async removeSkill(name: string): Promise<void> {
    const skill = this.installed.get(name);
    if (!skill) {
      throw new Error(`Skill "${name}" is not installed`);
    }

    const { rm } = await import("node:fs/promises");
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
  async getSkillInfo(name: string): Promise<RegistrySkillInfo> {
    const url = `${this.config.registryUrl}/api/v1/skills/${encodeURIComponent(name)}`;
    const response = await this.registryFetch(url);

    if (!response.ok) {
      throw new Error(`Skill "${name}" not found in registry (${response.status})`);
    }

    return (await response.json()) as RegistrySkillInfo;
  }

  /**
   * Get the SkillVerifier instance for custom verification workflows.
   */
  getVerifier(): SkillVerifier {
    return this.verifier;
  }

  /** Make an authenticated request to the registry. */
  private async registryFetch(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      throw new Error(
        `Registry request failed: ${response.status} ${response.statusText} (${url})`,
      );
    }

    return response;
  }

  /** Get the default skills directory (~/.arivuclaw/skills/). */
  private getDefaultSkillsDir(): string {
    const home =
      process.env["HOME"] ?? process.env["USERPROFILE"] ?? "/tmp";
    return `${home}/.arivuclaw/skills`;
  }

  /** Scan the skills directory for already-installed skills. */
  private async scanInstalledSkills(): Promise<void> {
    const { readdir, readFile, stat } = await import("node:fs/promises");
    const { join } = await import("node:path");

    try {
      const entries = await readdir(this.config.skillsDir);

      for (const entry of entries) {
        const skillDir = join(this.config.skillsDir, entry);
        const info = await stat(skillDir);
        if (!info.isDirectory()) continue;

        try {
          const manifestPath = join(skillDir, "manifest.json");
          const manifestData = await readFile(manifestPath, "utf-8");
          const manifest = JSON.parse(manifestData) as SkillManifest;

          this.installed.set(manifest.name, {
            name: manifest.name,
            version: manifest.version,
            path: skillDir,
            installedAt: info.mtime,
            manifest,
          });
        } catch {
          this.log.warn(`Skipping invalid skill directory: ${skillDir}`);
        }
      }
    } catch {
      this.log.debug(`Skills directory not found: ${this.config.skillsDir}`);
    }
  }

  /**
   * Extract a tarball buffer to a target directory.
   * Simplified implementation — a production system would use the `tar` package.
   */
  private async extractTarball(
    data: Buffer,
    targetDir: string,
  ): Promise<void> {
    const { writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

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
  private async createTarball(skillDir: string): Promise<Buffer> {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    // Simplified: just bundle the manifest as a proof of concept.
    // A real implementation would tar the entire directory.
    const manifestData = await readFile(join(skillDir, "manifest.json"));
    return manifestData;
  }
}

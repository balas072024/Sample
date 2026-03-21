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
export declare class SkillVerifier {
    private readonly log;
    private threatApiUrl;
    /**
     * Optionally configure a threat intelligence API endpoint.
     *
     * @param url - Base URL for the hash-lookup API (e.g. VirusTotal compatible).
     */
    setThreatApiUrl(url: string): void;
    /**
     * Verify the integrity and safety of a downloaded skill package.
     *
     * @param data - The raw tarball buffer.
     * @param expectedHash - The SHA-256 hash advertised by the registry.
     * @returns Verification result.
     */
    verify(data: Buffer, expectedHash: string): Promise<VerificationResult>;
}
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
export declare class MarketplaceClient {
    private readonly log;
    private readonly config;
    private readonly verifier;
    private readonly installed;
    /**
     * Create a new MarketplaceClient.
     *
     * @param config - Optional configuration overrides.
     */
    constructor(config?: Partial<MarketplaceConfig>);
    /**
     * Search the registry for skills matching a query and/or tags.
     *
     * @param query - Free-text search query.
     * @param tags - Optional tags to filter by.
     * @returns Search results from the registry.
     */
    searchSkills(query: string, tags?: string[]): Promise<RegistrySearchResult>;
    /**
     * Install a skill from the registry.
     *
     * @param name - Skill name.
     * @param version - Version to install (default: "latest").
     * @returns The installed skill metadata.
     */
    installSkill(name: string, version?: string): Promise<InstalledSkill>;
    /**
     * Publish a skill directory to the registry.
     *
     * @param skillDir - Absolute path to the skill source directory.
     * @returns The published skill info from the registry.
     */
    publishSkill(skillDir: string): Promise<RegistrySkillInfo>;
    /**
     * List all locally installed skills.
     *
     * @returns Array of installed skill records.
     */
    listInstalled(): Promise<InstalledSkill[]>;
    /**
     * Update an installed skill to the latest version.
     *
     * @param name - Skill name to update.
     * @returns The updated installed skill.
     */
    updateSkill(name: string): Promise<InstalledSkill>;
    /**
     * Remove an installed skill.
     *
     * @param name - Skill name to remove.
     */
    removeSkill(name: string): Promise<void>;
    /**
     * Get detailed information about a skill from the registry.
     *
     * @param name - Skill name.
     * @returns Skill info from the registry.
     */
    getSkillInfo(name: string): Promise<RegistrySkillInfo>;
    /**
     * Get the SkillVerifier instance for custom verification workflows.
     */
    getVerifier(): SkillVerifier;
    /** Make an authenticated request to the registry. */
    private registryFetch;
    /** Get the default skills directory (~/.arivuclaw/skills/). */
    private getDefaultSkillsDir;
    /** Scan the skills directory for already-installed skills. */
    private scanInstalledSkills;
    /**
     * Extract a tarball buffer to a target directory.
     * Simplified implementation — a production system would use the `tar` package.
     */
    private extractTarball;
    /**
     * Create a tarball from a skill directory.
     * Simplified implementation — a production system would use the `tar` package.
     */
    private createTarball;
}
//# sourceMappingURL=registry.d.ts.map
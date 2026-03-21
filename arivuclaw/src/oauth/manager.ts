/**
 * Arivumaiyam AI OAuth2 Authentication Manager
 *
 * Manages OAuth2 flows for multiple providers, storing tokens encrypted
 * at rest with AES-256-GCM. Supports authorization code grant with
 * PKCE for secure token acquisition.
 *
 * Supported providers: Google, GitHub, Slack, Microsoft, Discord, Spotify.
 *
 * @module oauth/manager
 */

import type { ChannelType } from "../core/types";
import { Logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

/** Supported OAuth providers. */
export type OAuthProviderName =
  | "google"
  | "github"
  | "slack"
  | "microsoft"
  | "discord"
  | "spotify";

/** OAuth provider configuration. */
export interface OAuthProviderConfig {
  /** Provider name. */
  name: OAuthProviderName;
  /** OAuth client ID. */
  clientId: string;
  /** OAuth client secret. */
  clientSecret: string;
  /** Authorization endpoint URL. */
  authUrl: string;
  /** Token endpoint URL. */
  tokenUrl: string;
  /** Revocation endpoint URL (if supported). */
  revokeUrl?: string;
  /** Redirect URI for callbacks. */
  redirectUri: string;
  /** Default scopes. */
  defaultScopes: string[];
}

/** Stored OAuth token set. */
export interface OAuthTokenSet {
  /** Access token. */
  accessToken: string;
  /** Refresh token (if provided). */
  refreshToken?: string;
  /** Token type (usually "Bearer"). */
  tokenType: string;
  /** Scopes granted. */
  scopes: string[];
  /** Expiry timestamp (epoch ms). */
  expiresAt: number;
  /** Provider this token belongs to. */
  provider: OAuthProviderName;
}

/** Pending authorization state. */
export interface AuthFlowState {
  /** Random state parameter for CSRF protection. */
  state: string;
  /** PKCE code verifier. */
  codeVerifier: string;
  /** Provider name. */
  provider: OAuthProviderName;
  /** Requested scopes. */
  scopes: string[];
  /** Timestamp when this flow was initiated. */
  createdAt: number;
}

/** Result of starting an auth flow. */
export interface AuthFlowResult {
  /** URL to redirect the user to for authorization. */
  authorizationUrl: string;
  /** State token used to correlate the callback. */
  state: string;
}

/** Encrypted token record stored on disk. */
export interface EncryptedToken {
  /** Base64-encoded encrypted payload. */
  ciphertext: string;
  /** Base64-encoded initialization vector. */
  iv: string;
  /** Base64-encoded authentication tag. */
  authTag: string;
  /** Provider name (stored in plaintext for lookup). */
  provider: OAuthProviderName;
}

// ─── Default Provider Configurations ─────────────────────────────────

/** Well-known OAuth endpoints for supported providers. */
const DEFAULT_PROVIDERS: Record<OAuthProviderName, Omit<OAuthProviderConfig, "clientId" | "clientSecret" | "redirectUri">> = {
  google: {
    name: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    defaultScopes: ["openid", "profile", "email"],
  },
  github: {
    name: "github",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    revokeUrl: undefined,
    defaultScopes: ["user", "repo"],
  },
  slack: {
    name: "slack",
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    revokeUrl: "https://slack.com/api/auth.revoke",
    defaultScopes: ["chat:write", "channels:read"],
  },
  microsoft: {
    name: "microsoft",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    revokeUrl: undefined,
    defaultScopes: ["openid", "profile", "User.Read"],
  },
  discord: {
    name: "discord",
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    revokeUrl: "https://discord.com/api/oauth2/token/revoke",
    defaultScopes: ["identify", "guilds"],
  },
  spotify: {
    name: "spotify",
    authUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    revokeUrl: undefined,
    defaultScopes: ["user-read-private", "user-read-email"],
  },
};

// ─── Token Store ─────────────────────────────────────────────────────

/**
 * Encrypts and stores OAuth tokens at rest using AES-256-GCM.
 *
 * Tokens are encrypted with a master key derived from the provided secret.
 * The store persists tokens to a JSON file in the Arivumaiyam AI config directory.
 *
 * @example
 * ```ts
 * const store = new TokenStore("my-secret-master-key");
 * await store.initialize();
 * await store.save("google", tokenSet);
 * const token = await store.load("google");
 * ```
 */
export class TokenStore {
  private readonly log = Logger.create("TokenStore");
  private readonly masterKey: Buffer;
  private readonly storePath: string;
  private tokens = new Map<OAuthProviderName, EncryptedToken>();

  /**
   * Create a new TokenStore.
   *
   * @param masterKeySecret - Secret string used to derive the AES-256 key.
   * @param storePath - Path to the encrypted token store file.
   */
  constructor(masterKeySecret: string, storePath?: string) {
    // Derive a 32-byte key from the master secret using SHA-256
    const crypto = require("node:crypto") as typeof import("node:crypto");
    this.masterKey = crypto.createHash("sha256").update(masterKeySecret).digest();

    const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? "/tmp";
    this.storePath = storePath ?? `${home}/.arivuclaw/tokens.enc.json`;
  }

  /**
   * Initialize the token store by loading persisted tokens from disk.
   */
  async initialize(): Promise<void> {
    const { readFile, mkdir } = await import("node:fs/promises");
    const { dirname } = await import("node:path");

    await mkdir(dirname(this.storePath), { recursive: true });

    try {
      const data = await readFile(this.storePath, "utf-8");
      const records = JSON.parse(data) as EncryptedToken[];
      for (const record of records) {
        this.tokens.set(record.provider, record);
      }
      this.log.info(`Loaded ${this.tokens.size} encrypted token(s)`);
    } catch {
      this.log.debug("No existing token store found, starting fresh");
    }
  }

  /**
   * Encrypt and save a token set.
   *
   * @param provider - The provider this token belongs to.
   * @param tokenSet - The token set to encrypt and store.
   */
  async save(provider: OAuthProviderName, tokenSet: OAuthTokenSet): Promise<void> {
    const crypto = await import("node:crypto");

    const plaintext = JSON.stringify(tokenSet);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf-8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const encryptedToken: EncryptedToken = {
      ciphertext: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      provider,
    };

    this.tokens.set(provider, encryptedToken);
    await this.persist();

    this.log.debug(`Token saved for provider: ${provider}`);
  }

  /**
   * Load and decrypt a token set.
   *
   * @param provider - The provider whose token to load.
   * @returns The decrypted token set, or undefined if not found.
   */
  async load(provider: OAuthProviderName): Promise<OAuthTokenSet | undefined> {
    const encryptedToken = this.tokens.get(provider);
    if (!encryptedToken) return undefined;

    const crypto = await import("node:crypto");

    const iv = Buffer.from(encryptedToken.iv, "base64");
    const authTag = Buffer.from(encryptedToken.authTag, "base64");
    const ciphertext = Buffer.from(encryptedToken.ciphertext, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf-8")) as OAuthTokenSet;
  }

  /**
   * Remove a stored token.
   *
   * @param provider - The provider whose token to remove.
   */
  async remove(provider: OAuthProviderName): Promise<void> {
    this.tokens.delete(provider);
    await this.persist();
    this.log.debug(`Token removed for provider: ${provider}`);
  }

  /**
   * Check whether a token exists for a provider.
   *
   * @param provider - The provider to check.
   */
  has(provider: OAuthProviderName): boolean {
    return this.tokens.has(provider);
  }

  /** Persist the encrypted tokens to disk. */
  private async persist(): Promise<void> {
    const { writeFile } = await import("node:fs/promises");
    const data = JSON.stringify(Array.from(this.tokens.values()), null, 2);
    await writeFile(this.storePath, data, "utf-8");
  }
}

// ─── OAuth Manager ───────────────────────────────────────────────────

/**
 * Manages OAuth2 authentication flows for multiple providers.
 *
 * Handles the full OAuth2 authorization code grant lifecycle:
 * 1. Generate authorization URL with PKCE
 * 2. Handle callback with authorization code
 * 3. Exchange code for tokens
 * 4. Refresh expired tokens
 * 5. Revoke tokens
 *
 * @example
 * ```ts
 * const oauth = new OAuthManager("master-secret");
 * await oauth.initialize();
 *
 * oauth.configureProvider("google", {
 *   clientId: "...",
 *   clientSecret: "...",
 *   redirectUri: "http://localhost:7890/oauth/callback",
 * });
 *
 * const { authorizationUrl } = await oauth.startAuthFlow("google", ["email", "calendar"]);
 * // ... user completes login ...
 * await oauth.handleCallback(code, state);
 * const token = await oauth.getAccessToken("google");
 * ```
 */
export class OAuthManager {
  private readonly log = Logger.create("OAuthManager");
  private readonly tokenStore: TokenStore;
  private readonly providers = new Map<OAuthProviderName, OAuthProviderConfig>();
  private readonly pendingFlows = new Map<string, AuthFlowState>();

  /**
   * Create a new OAuthManager.
   *
   * @param masterKeySecret - Secret string for encrypting stored tokens.
   * @param tokenStorePath - Optional custom path for the token store file.
   */
  constructor(masterKeySecret: string, tokenStorePath?: string) {
    this.tokenStore = new TokenStore(masterKeySecret, tokenStorePath);
  }

  /**
   * Initialize the OAuth manager and load persisted tokens.
   */
  async initialize(): Promise<void> {
    await this.tokenStore.initialize();
    this.log.info("OAuth manager initialized");
  }

  /**
   * Configure a provider with client credentials.
   *
   * @param provider - Provider name.
   * @param config - Client ID, secret, and redirect URI.
   */
  configureProvider(
    provider: OAuthProviderName,
    config: { clientId: string; clientSecret: string; redirectUri: string; scopes?: string[] },
  ): void {
    const defaults = DEFAULT_PROVIDERS[provider];
    if (!defaults) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    this.providers.set(provider, {
      ...defaults,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      defaultScopes: config.scopes ?? defaults.defaultScopes,
    });

    this.log.info(`OAuth provider configured: ${provider}`);
  }

  /**
   * Start an OAuth authorization flow.
   *
   * @param provider - The provider to authenticate with.
   * @param scopes - Scopes to request (defaults to provider's default scopes).
   * @returns The authorization URL and state token.
   */
  async startAuthFlow(
    provider: OAuthProviderName,
    scopes?: string[],
  ): Promise<AuthFlowResult> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(
        `Provider "${provider}" is not configured. Call configureProvider() first.`,
      );
    }

    const crypto = await import("node:crypto");

    // Generate PKCE parameters
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    const resolvedScopes = scopes ?? providerConfig.defaultScopes;

    // Store pending flow state
    const flowState: AuthFlowState = {
      state,
      codeVerifier,
      provider,
      scopes: resolvedScopes,
      createdAt: Date.now(),
    };
    this.pendingFlows.set(state, flowState);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      response_type: "code",
      scope: resolvedScopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authorizationUrl = `${providerConfig.authUrl}?${params}`;

    this.log.info(`Auth flow started for ${provider} (state: ${state.slice(0, 8)}...)`);
    return { authorizationUrl, state };
  }

  /**
   * Handle the OAuth callback with the authorization code.
   *
   * @param code - The authorization code from the callback.
   * @param state - The state parameter from the callback.
   * @returns The obtained token set.
   */
  async handleCallback(code: string, state: string): Promise<OAuthTokenSet> {
    const flowState = this.pendingFlows.get(state);
    if (!flowState) {
      throw new Error("Invalid or expired OAuth state parameter");
    }

    // Clean up expired flows (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60_000;
    for (const [s, flow] of this.pendingFlows) {
      if (flow.createdAt < tenMinutesAgo) {
        this.pendingFlows.delete(s);
      }
    }

    this.pendingFlows.delete(state);

    const providerConfig = this.providers.get(flowState.provider);
    if (!providerConfig) {
      throw new Error(`Provider "${flowState.provider}" is not configured`);
    }

    // Exchange code for tokens
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: providerConfig.redirectUri,
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code_verifier: flowState.codeVerifier,
    });

    const response = await fetch(providerConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token exchange failed for ${flowState.provider}: ${response.status} ${errorText}`,
      );
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    };

    const tokenSet: OAuthTokenSet = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type ?? "Bearer",
      scopes: tokenData.scope?.split(" ") ?? flowState.scopes,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      provider: flowState.provider,
    };

    // Encrypt and store
    await this.tokenStore.save(flowState.provider, tokenSet);

    this.log.info(`Token obtained for ${flowState.provider}`);
    return tokenSet;
  }

  /**
   * Get a valid access token for a provider, refreshing if expired.
   *
   * @param provider - The provider to get a token for.
   * @returns The access token string.
   */
  async getAccessToken(provider: OAuthProviderName): Promise<string> {
    const tokenSet = await this.tokenStore.load(provider);
    if (!tokenSet) {
      throw new Error(`No token stored for provider: ${provider}`);
    }

    // Refresh if expired (with 5 minute buffer)
    if (tokenSet.expiresAt < Date.now() + 5 * 60_000) {
      this.log.debug(`Token for ${provider} is expired, refreshing...`);
      const refreshed = await this.refreshToken(provider);
      return refreshed.accessToken;
    }

    return tokenSet.accessToken;
  }

  /**
   * Refresh an expired token using the refresh token.
   *
   * @param provider - The provider whose token to refresh.
   * @returns The refreshed token set.
   */
  async refreshToken(provider: OAuthProviderName): Promise<OAuthTokenSet> {
    const tokenSet = await this.tokenStore.load(provider);
    if (!tokenSet?.refreshToken) {
      throw new Error(`No refresh token available for provider: ${provider}`);
    }

    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider "${provider}" is not configured`);
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenSet.refreshToken,
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
    });

    const response = await fetch(providerConfig.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed for ${provider}: ${response.status} ${errorText}`,
      );
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    };

    const newTokenSet: OAuthTokenSet = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? tokenSet.refreshToken,
      tokenType: tokenData.token_type ?? "Bearer",
      scopes: tokenData.scope?.split(" ") ?? tokenSet.scopes,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      provider,
    };

    await this.tokenStore.save(provider, newTokenSet);
    this.log.info(`Token refreshed for ${provider}`);
    return newTokenSet;
  }

  /**
   * Revoke a stored token.
   *
   * @param provider - The provider whose token to revoke.
   */
  async revokeToken(provider: OAuthProviderName): Promise<void> {
    const tokenSet = await this.tokenStore.load(provider);
    if (!tokenSet) {
      this.log.warn(`No token to revoke for provider: ${provider}`);
      return;
    }

    const providerConfig = this.providers.get(provider);
    if (providerConfig?.revokeUrl) {
      try {
        const body = new URLSearchParams({
          token: tokenSet.accessToken,
          client_id: providerConfig.clientId,
          client_secret: providerConfig.clientSecret,
        });

        await fetch(providerConfig.revokeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });

        this.log.info(`Token revoked at provider: ${provider}`);
      } catch (error) {
        this.log.warn(`Failed to revoke token at provider: ${error}`);
      }
    }

    await this.tokenStore.remove(provider);
    this.log.info(`Token removed for ${provider}`);
  }

  /**
   * Check whether a token exists for a provider.
   *
   * @param provider - The provider to check.
   */
  hasToken(provider: OAuthProviderName): boolean {
    return this.tokenStore.has(provider);
  }

  /**
   * Get the underlying TokenStore for direct access.
   */
  getTokenStore(): TokenStore {
    return this.tokenStore;
  }
}

/**
 * ArivuClaw OAuth2 Authentication Manager
 *
 * Manages OAuth2 flows for multiple providers, storing tokens encrypted
 * at rest with AES-256-GCM. Supports authorization code grant with
 * PKCE for secure token acquisition.
 *
 * Supported providers: Google, GitHub, Slack, Microsoft, Discord, Spotify.
 *
 * @module oauth/manager
 */
/** Supported OAuth providers. */
export type OAuthProviderName = "google" | "github" | "slack" | "microsoft" | "discord" | "spotify";
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
/**
 * Encrypts and stores OAuth tokens at rest using AES-256-GCM.
 *
 * Tokens are encrypted with a master key derived from the provided secret.
 * The store persists tokens to a JSON file in the ArivuClaw config directory.
 *
 * @example
 * ```ts
 * const store = new TokenStore("my-secret-master-key");
 * await store.initialize();
 * await store.save("google", tokenSet);
 * const token = await store.load("google");
 * ```
 */
export declare class TokenStore {
    private readonly log;
    private readonly masterKey;
    private readonly storePath;
    private tokens;
    /**
     * Create a new TokenStore.
     *
     * @param masterKeySecret - Secret string used to derive the AES-256 key.
     * @param storePath - Path to the encrypted token store file.
     */
    constructor(masterKeySecret: string, storePath?: string);
    /**
     * Initialize the token store by loading persisted tokens from disk.
     */
    initialize(): Promise<void>;
    /**
     * Encrypt and save a token set.
     *
     * @param provider - The provider this token belongs to.
     * @param tokenSet - The token set to encrypt and store.
     */
    save(provider: OAuthProviderName, tokenSet: OAuthTokenSet): Promise<void>;
    /**
     * Load and decrypt a token set.
     *
     * @param provider - The provider whose token to load.
     * @returns The decrypted token set, or undefined if not found.
     */
    load(provider: OAuthProviderName): Promise<OAuthTokenSet | undefined>;
    /**
     * Remove a stored token.
     *
     * @param provider - The provider whose token to remove.
     */
    remove(provider: OAuthProviderName): Promise<void>;
    /**
     * Check whether a token exists for a provider.
     *
     * @param provider - The provider to check.
     */
    has(provider: OAuthProviderName): boolean;
    /** Persist the encrypted tokens to disk. */
    private persist;
}
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
export declare class OAuthManager {
    private readonly log;
    private readonly tokenStore;
    private readonly providers;
    private readonly pendingFlows;
    /**
     * Create a new OAuthManager.
     *
     * @param masterKeySecret - Secret string for encrypting stored tokens.
     * @param tokenStorePath - Optional custom path for the token store file.
     */
    constructor(masterKeySecret: string, tokenStorePath?: string);
    /**
     * Initialize the OAuth manager and load persisted tokens.
     */
    initialize(): Promise<void>;
    /**
     * Configure a provider with client credentials.
     *
     * @param provider - Provider name.
     * @param config - Client ID, secret, and redirect URI.
     */
    configureProvider(provider: OAuthProviderName, config: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes?: string[];
    }): void;
    /**
     * Start an OAuth authorization flow.
     *
     * @param provider - The provider to authenticate with.
     * @param scopes - Scopes to request (defaults to provider's default scopes).
     * @returns The authorization URL and state token.
     */
    startAuthFlow(provider: OAuthProviderName, scopes?: string[]): Promise<AuthFlowResult>;
    /**
     * Handle the OAuth callback with the authorization code.
     *
     * @param code - The authorization code from the callback.
     * @param state - The state parameter from the callback.
     * @returns The obtained token set.
     */
    handleCallback(code: string, state: string): Promise<OAuthTokenSet>;
    /**
     * Get a valid access token for a provider, refreshing if expired.
     *
     * @param provider - The provider to get a token for.
     * @returns The access token string.
     */
    getAccessToken(provider: OAuthProviderName): Promise<string>;
    /**
     * Refresh an expired token using the refresh token.
     *
     * @param provider - The provider whose token to refresh.
     * @returns The refreshed token set.
     */
    refreshToken(provider: OAuthProviderName): Promise<OAuthTokenSet>;
    /**
     * Revoke a stored token.
     *
     * @param provider - The provider whose token to revoke.
     */
    revokeToken(provider: OAuthProviderName): Promise<void>;
    /**
     * Check whether a token exists for a provider.
     *
     * @param provider - The provider to check.
     */
    hasToken(provider: OAuthProviderName): boolean;
    /**
     * Get the underlying TokenStore for direct access.
     */
    getTokenStore(): TokenStore;
}
//# sourceMappingURL=manager.d.ts.map
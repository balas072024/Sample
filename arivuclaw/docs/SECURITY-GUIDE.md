# Arivumaiyam AI — Security Guide

> Defense-in-depth: 3 execution modes, guardrails, sandboxing, OAuth2, HMAC webhooks, audit logging, backup/restore.

---

## Execution Modes

Arivumaiyam AI ships with three execution modes. Set via the `ARIVUCLAW_MODE` environment variable or the `mode` config field.

### Mode Overview

| Mode | Sandbox | Guardrails | Shell Skills | Filesystem | Network | Default |
|---|---|---|---|---|---|---|
| `unrestricted` | Optional | Off | Yes | Full | Full | Yes |
| `local-admin` | Lightweight VM | Per-tool | Yes | Read + scoped write | Controlled | No |
| `restricted` | gVisor / Firecracker | Enforced | No | Read-only | Blocked | No |

### unrestricted

The owner trusts Arivumaiyam AI completely. All 112 skills are available. Tools execute immediately without approval. The sandbox is optional (can be enabled selectively). This is the default mode for local laptop usage.

```bash
export ARIVUCLAW_MODE=unrestricted
```

### local-admin

Suitable for a home server or team deployment. Shell skills run inside a lightweight VM. Network access is controlled by a domain allowlist. Filesystem writes are scoped to a configured directory.

```bash
export ARIVUCLAW_MODE=local-admin
```

### restricted

Designed for public-facing deployments or multi-tenant use. Shell skills are disabled entirely. Filesystem access is read-only. All LLM output passes through the guardrail stack before delivery. Suitable for regulated environments.

```bash
export ARIVUCLAW_MODE=restricted
```

---

## Config File Format

Full configuration reference (`arivuclaw.config.ts`):

```typescript
export default {
  mode: "unrestricted",           // 'unrestricted' | 'local-admin' | 'restricted'

  security: {
    // Rate limiting
    rateLimit: {
      perUser: 60,                // requests per window
      perChannel: 300,
      global: 1000,
      windowMs: 60_000,           // 1 minute
    },

    // Path access control
    allowedPaths: [
      "./workspace",
      "/tmp/arivuclaw",
    ],
    blockedPaths: [
      "/etc",
      "/root",
      "~/.ssh",
    ],

    // Network access control
    allowedDomains: [
      "api.openai.com",
      "api.anthropic.com",
      "*.github.com",
    ],
    blockedDomains: [
      "169.254.169.254",          // AWS metadata endpoint
    ],

    // Sandbox configuration
    sandbox: {
      enabled: true,
      engine: "vm",               // 'vm' | 'gvisor' | 'firecracker'
      timeoutMs: 30_000,
      maxOutputBytes: 1_048_576,  // 1 MB
      allowNetwork: true,
      allowFilesystem: true,
    },

    // Audit logging
    audit: {
      enabled: true,
      logPath: ".arivuclaw/audit.log",
      includeToolInputs: true,
      includeToolOutputs: false,  // may contain sensitive data
    },
  },

  guardrails: {
    enabled: false,               // true to enable
    defaultAction: "allow",       // 'allow' | 'deny' | 'ask'
    ownerUserId: "owner",
    rules: [
      {
        id: "block-rm-rf",
        match: { tool: "shell", pattern: "rm -rf" },
        action: "deny",
        reason: "Destructive command blocked",
      },
      {
        id: "ask-for-git-push",
        match: { tool: "git_push" },
        action: "ask",
        reason: "Confirm before pushing to remote",
      },
    ],
  },

  oauth: {
    callbackBaseUrl: "https://yourdomain.com",
    providers: {
      google:    { clientId: process.env.GOOGLE_CLIENT_ID,    clientSecret: process.env.GOOGLE_CLIENT_SECRET },
      github:    { clientId: process.env.GITHUB_CLIENT_ID,    clientSecret: process.env.GITHUB_CLIENT_SECRET },
      slack:     { clientId: process.env.SLACK_CLIENT_ID,     clientSecret: process.env.SLACK_CLIENT_SECRET },
      microsoft: { clientId: process.env.MICROSOFT_CLIENT_ID, clientSecret: process.env.MICROSOFT_CLIENT_SECRET },
      discord:   { clientId: process.env.DISCORD_CLIENT_ID,   clientSecret: process.env.DISCORD_CLIENT_SECRET },
      spotify:   { clientId: process.env.SPOTIFY_CLIENT_ID,   clientSecret: process.env.SPOTIFY_CLIENT_SECRET },
    },
  },

  mcp: {
    server: {
      enabled: true,
      port: 3002,
      authToken: process.env.MCP_AUTH_TOKEN,
    },
    clients: [
      {
        url: "http://other-agent:3002",
        authToken: process.env.EXTERNAL_MCP_TOKEN,
        transport: "http",
      },
    ],
  },

  webhooks: {
    enabled: true,
    port: 3003,
    secret: process.env.WEBHOOK_SECRET,
    endpoints: [
      { path: "/github", verifyHmac: true, handler: "github-events" },
    ],
  },

  backup: {
    backupDir: ".arivuclaw/backups",
    includeMemory: true,
    includeConfig: true,
    autoBackupCron: "0 2 * * *",    // 02:00 daily
  },
};
```

---

## Environment Variables

```bash
# Core
ARIVUCLAW_MODE=unrestricted          # execution mode
ARIVUCLAW_PORT=3000                  # gateway port
ARIVUCLAW_HOST=0.0.0.0               # gateway host
ARIVUCLAW_PROVIDER=anthropic         # default LLM provider
ARIVUCLAW_LOG_LEVEL=info             # error | warn | info | debug

# Security
ARIVUCLAW_RATE_LIMIT_PER_USER=60
ARIVUCLAW_RATE_LIMIT_WINDOW_MS=60000
ARIVUCLAW_SANDBOX_TIMEOUT_MS=30000
ARIVUCLAW_SANDBOX_ENGINE=vm          # vm | gvisor | firecracker

# Guardrails
ARIVUCLAW_GUARDRAILS_ENABLED=false
ARIVUCLAW_GUARDRAILS_DEFAULT_ACTION=allow
ARIVUCLAW_OWNER_USER_ID=owner

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# MCP
MCP_AUTH_TOKEN=
EXTERNAL_MCP_TOKEN=

# Webhooks
WEBHOOK_SECRET=

# Backup
ARIVUCLAW_BACKUP_DIR=.arivuclaw/backups
ARIVUCLAW_AUTO_BACKUP_CRON=0 2 * * *

# Channels (see CHANNELS-GUIDE.md for full list)
WHATSAPP_SESSION_PATH=auth/whatsapp
TELEGRAM_BOT_TOKEN=
DISCORD_BOT_TOKEN=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
```

---

## Guardrails System

Guardrails are owner-controlled rules evaluated by `GuardrailManager` on every tool call before execution.

### Rule Format

```typescript
interface GuardrailRule {
  id: string;
  match: {
    tool?: string;          // exact tool name or glob pattern
    pattern?: string;       // regex against serialised tool arguments
    permission?: string;    // permission level
  };
  action: "allow" | "deny" | "ask";
  reason?: string;          // shown to user when action is 'ask' or 'deny'
}
```

### Example Rules

```yaml
# guardrails.yaml
rules:
  # Block all shell commands containing dangerous flags
  - id: block-destructive-shell
    match:
      tool: shell
      pattern: "(rm -rf|mkfs|dd if=|:(){ :|:&};:)"
    action: deny
    reason: "Destructive shell command blocked by guardrail"

  # Ask for confirmation before any git push
  - id: confirm-git-push
    match:
      tool: git_push
    action: ask
    reason: "Please confirm: push to remote?"

  # Always allow read-only tools
  - id: allow-read
    match:
      permission: read
    action: allow

  # Block all admin-permission tools in restricted mode
  - id: block-admin
    match:
      permission: admin
    action: deny
    reason: "Admin operations not permitted in this mode"
```

### ask Flow

When a rule triggers with `action: ask`, Arivumaiyam AI:

1. Pauses execution and sends an approval request to `ownerUserId`.
2. The owner receives a formatted message: "Arivumaiyam AI wants to run `git_push` — [Approve] [Deny]".
3. On approval, execution continues. On denial, a permission error is returned.
4. Requests time out after 5 minutes (configurable via `guardrailAskTimeoutMs`).

---

## OAuth2 Setup

The `OAuthManager` provides tokens for skills that integrate with external services.

### Supported Providers

| Provider | Scopes Example | Usage |
|---|---|---|
| Google | `calendar.readonly email profile` | Calendar, Gmail |
| GitHub | `repo user` | GitHub ops skill |
| Slack | `channels:read chat:write` | Slack ops skill |
| Microsoft | `Calendars.Read Mail.Send` | Teams, Outlook |
| Discord | `identify guilds` | Discord ops |
| Spotify | `user-read-playback-state` | Spotify skill |

### Flow

```
User: "Check my Google Calendar"
  → AgentRuntime detects Google Calendar tool
  → OAuthManager.getToken("google", userId) → null
  → Agent replies: "Please authorize Google Calendar:
     https://yourdomain.com/oauth/google/auth?state=..."
  → User clicks link → Google consent screen
  → Callback: POST /oauth/google/callback?code=...&state=...
  → OAuthManager stores token securely
  → Next request: token available, skill proceeds
```

### Configuration Example

```typescript
oauth: {
  callbackBaseUrl: "https://yourdomain.com",
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    },
  },
},
```

---

## MCP Security

The `MCPServer` requires bearer-token authentication for all connections.

```bash
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
```

All tool calls arriving via MCP pass through `SecurityGuard` identically to local tool calls. The effective permissions are the intersection of the MCP client's declared permissions and the local guardrail rules.

Connecting to external MCP servers:

```typescript
mcp: {
  clients: [
    {
      url: "http://trusted-agent:3002",
      authToken: process.env.TRUSTED_AGENT_TOKEN,
      transport: "http",
      // Tools imported from this server are tagged 'external'
      // and subject to local guardrails
    },
  ],
}
```

---

## Webhook HMAC Verification

Incoming webhooks can be HMAC-SHA256 verified:

```bash
export WEBHOOK_SECRET=$(openssl rand -hex 32)
```

Arivumaiyam AI computes `HMAC-SHA256(secret, raw_body)` and compares to the `X-Hub-Signature-256` header (GitHub convention) or the `X-Arivuclaw-Signature` header. Timing-safe comparison is used to prevent timing attacks.

```typescript
webhooks: {
  secret: process.env.WEBHOOK_SECRET,
  endpoints: [
    {
      path: "/webhook/github",
      verifyHmac: true,
      handler: async (payload, headers) => {
        // payload has already been signature-verified
        await agentRuntime.processEvent("github.push", payload);
      },
    },
  ],
},
```

---

## Container Sandbox

Three sandbox engines are available:

### vm (default)

Uses Node.js `vm` module with a timeout and restricted global scope. Fast, zero dependencies. Suitable for `unrestricted` and `local-admin` modes.

### gvisor

Requires `runsc` (gVisor) to be installed. Each tool call runs in a gVisor container. Provides strong syscall filtering. Recommended for `restricted` mode.

```bash
# Install gVisor
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
sudo apt-get install runsc
```

```typescript
sandbox: { engine: "gvisor", enabled: true }
```

### firecracker

Each tool call runs in a Firecracker microVM. Strongest isolation. Requires KVM and the `firectl` binary. Adds ~100 ms startup per tool call.

```typescript
sandbox: { engine: "firecracker", enabled: true }
```

---

## Audit Logging

When `audit.enabled: true`, every tool call and guardrail decision is written to the audit log as structured JSON.

```json
{
  "timestamp": "2026-03-21T10:00:00.000Z",
  "event": "tool.call",
  "userId": "user_abc",
  "channelType": "telegram",
  "sessionId": "sess_xyz",
  "toolName": "shell",
  "toolInput": { "command": "ls -la" },
  "guardrailDecision": "allow",
  "durationMs": 142,
  "success": true
}
```

Log rotation is handled by the underlying Winston logger. Configure `maxFiles` and `maxSize` in the logger config.

---

## Backup and Restore

The `BackupManager` snapshots config, memory, sessions, and OAuth tokens.

```bash
# Create backup
npx arivuclaw backup create --label before-upgrade

# List backups
npx arivuclaw backup list

# Restore
npx arivuclaw backup restore .arivuclaw/backups/2026-03-21-before-upgrade.tar.gz
```

Programmatic usage:

```typescript
const backup = new BackupManager({ backupDir: ".arivuclaw/backups" });
const path = await backup.createBackup("before-upgrade");
await backup.restoreBackup(path);
```

Auto-backup cron:

```typescript
backup: {
  autoBackupCron: "0 2 * * *",   // daily at 02:00
  retainCount: 14,               // keep last 14 backups
}
```

---

## Security Checklist

| Item | Status |
|---|---|
| Set `ARIVUCLAW_MODE` appropriate for your deployment | Required |
| Rotate all API keys to environment variables | Required |
| Enable `audit.enabled: true` in production | Recommended |
| Set `WEBHOOK_SECRET` and enable HMAC verification | Required if using webhooks |
| Set `MCP_AUTH_TOKEN` if MCP server is exposed | Required |
| Use `restricted` mode for multi-tenant or public deployments | Recommended |
| Enable `sandbox.engine: gvisor` or `firecracker` for `restricted` mode | Recommended |
| Schedule daily backups via `autoBackupCron` | Recommended |
| Rotate OAuth tokens periodically via `OAuthManager.refreshToken()` | Recommended |
| Review audit logs regularly | Recommended |

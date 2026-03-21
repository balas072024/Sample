# Arivumaiyam AI — Channels Guide

> 10 channels. One unified agent. Cross-channel identity and session continuity.

---

## Channel Capabilities Overview

| Channel | File | Library | Streaming | File Upload | Rich Text | Reactions | Threads |
|---|---|---|---|---|---|---|---|
| WhatsApp | `channels/whatsapp.ts` | Baileys | Typing indicator | Yes | Yes | No | No |
| Telegram | `channels/telegram.ts` | grammy | Edit-in-place | Yes | Yes (Markdown/HTML) | Yes | No |
| Discord | `channels/discord.ts` | discord.js | Edit-in-place | Yes | Yes (Embeds) | Yes | Yes |
| Slack | `channels/slack.ts` | @slack/bolt | Message update | Yes | Yes (Block Kit) | Yes | Yes |
| Web | `channels/web.ts` | ws | WebSocket chunks | Yes | Yes | No | No |
| CLI | `channels/cli.ts` | readline | stdout | No | ANSI | No | No |
| Signal | `channels/extra/signal.ts` | signal-cli | No | Yes | No | No | No |
| iMessage | `channels/extra/imessage.ts` | AppleScript | No | Yes | No | No | No |
| Teams | `channels/extra/teams.ts` | botframework | Activity update | Yes | Yes (Adaptive Cards) | No | Yes |
| Matrix | `channels/extra/matrix.ts` | matrix-js-sdk | Event stream | Yes | Yes (HTML) | Yes | No |

---

## WhatsApp

**Library:** [Baileys](https://github.com/WhiskeySockets/Baileys) (unofficial WhatsApp Web API)

### Setup

```bash
export WHATSAPP_SESSION_PATH=auth/whatsapp

# In arivuclaw.config.ts
channels: {
  whatsapp: {
    enabled: true,
    sessionPath: process.env.WHATSAPP_SESSION_PATH ?? "auth/whatsapp",
    printQR: true,              // print QR to terminal on first run
  }
}
```

### First-Time Authentication

```bash
arivuclaw start
# A QR code appears in the terminal.
# Open WhatsApp on your phone → Linked Devices → Link a Device → scan QR.
# Session is saved to auth/whatsapp/ — subsequent starts are automatic.
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `sessionPath` | string | `auth/whatsapp` | Where Baileys stores session keys |
| `printQR` | boolean | `true` | Print QR code on first run |
| `reconnectIntervalMs` | number | `5000` | Reconnect delay on disconnect |
| `maxQueueSize` | number | `100` | Outbound message queue size |
| `markRead` | boolean | `true` | Mark messages read after processing |

### Streaming

WhatsApp does not support real-time message editing. Streaming is simulated via:
1. Send a typing indicator while the LLM generates.
2. Deliver the complete response as a single message.

### Notes

- Baileys connects via WhatsApp Web; your phone must remain connected to the internet.
- Business API (official) is not yet supported.
- Group messages are supported. Use `@mention` to trigger the agent.

---

## Telegram

**Library:** [grammy](https://grammy.dev/)

### Setup

```bash
# Create a bot via @BotFather on Telegram
# /newbot → get BOT_TOKEN
export TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

```typescript
channels: {
  telegram: {
    enabled: true,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,  // optional; polling used if absent
    webhookPort: 3004,
  }
}
```

### Webhook vs. Polling

| Mode | When to Use |
|---|---|
| Long polling (default) | Local development, no public HTTPS required |
| Webhook | Production; requires public HTTPS URL |

```bash
# Set webhook
arivuclaw telegram set-webhook --url https://yourdomain.com/webhook/telegram
# Remove webhook (revert to polling)
arivuclaw telegram delete-webhook
```

### Streaming

Arivumaiyam AI streams to Telegram by sending an initial "..." message, then editing it with progressive content chunks at configurable intervals (default 800 ms).

### Group Bots

In groups, the bot only responds when:
- Mentioned directly: `@YourBot what is the weather?`
- Replied to
- A configured keyword is used

Configure via `telegram.triggerOnMention: true` (default).

---

## Discord

**Library:** [discord.js](https://discord.js.org/)

### Setup

```bash
# Create application at discord.com/developers
# Add a Bot, copy token
export DISCORD_BOT_TOKEN=MTAy...
```

```typescript
channels: {
  discord: {
    enabled: true,
    botToken: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,    // for slash command registration
    guildId: process.env.DISCORD_GUILD_ID,      // optional: restrict to one server
    triggerOnMention: true,
    triggerOnDM: true,
    prefix: "!",                                // optional command prefix
  }
}
```

### Required Bot Permissions

| Permission | Why |
|---|---|
| `Send Messages` | Send responses |
| `Read Message History` | Context retrieval |
| `Embed Links` | Rich embeds |
| `Attach Files` | File responses |
| `Add Reactions` | Reaction acknowledgements |
| `Use Slash Commands` | `/ask` and other slash commands |
| `Manage Messages` | Edit streaming messages |

### Slash Commands

```bash
# Register slash commands with Discord
arivuclaw discord register-commands
```

Available slash commands:
- `/ask <message>` — ask the agent
- `/skills` — list available skills
- `/memory clear` — clear your memory
- `/persona set <name>` — switch agent persona

### Streaming

Discord supports message editing. Arivumaiyam AI sends an initial message and edits it in-place as tokens arrive (rate-limited to one edit per 800 ms to respect Discord's rate limits).

---

## Slack

**Library:** [@slack/bolt](https://slack.dev/bolt-js/)

### Setup

```bash
# Create app at api.slack.com/apps
# Add Bot Token Scopes: chat:write, channels:read, im:read, im:write, app_mentions:read
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_APP_TOKEN=xapp-...          # for Socket Mode
export SLACK_SIGNING_SECRET=...
```

```typescript
channels: {
  slack: {
    enabled: true,
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,          // recommended; no public URL needed
    port: 3005,                // used in HTTP mode
  }
}
```

### Socket Mode vs. HTTP

| Mode | Setup | Public URL |
|---|---|---|
| Socket Mode (default) | Simpler, works behind NAT | Not required |
| HTTP Events | Requires public HTTPS URL | Required |

### Rich Output

Arivumaiyam AI formats Slack responses using Block Kit when rich content is detected (tables, code blocks, lists).

```typescript
// Block Kit rendering is automatic.
// Disable with:
channels: { slack: { useBlockKit: false } }
```

### Streaming

Slack supports message updates. Arivumaiyam AI posts an initial message and calls `chat.update` periodically as tokens arrive.

---

## Web (WebSocket)

**Library:** [ws](https://github.com/websockets/ws)

The Web channel provides a WebSocket and HTTP API for embedding Arivumaiyam AI into web applications.

### Setup

```typescript
channels: {
  web: {
    enabled: true,
    port: 3000,               // same as gateway port
    corsOrigins: ["https://yourdomain.com", "http://localhost:5173"],
    jwtSecret: process.env.WEB_JWT_SECRET,    // optional auth
    maxMessageLength: 8192,
  }
}
```

### WebSocket Protocol

```javascript
// Client-side
const ws = new WebSocket("wss://yourdomain.com/ws");

// Authenticate (if jwtSecret is set)
ws.send(JSON.stringify({ type: "auth", token: "your-jwt" }));

// Send message
ws.send(JSON.stringify({ type: "message", content: "Hello agent!", sessionId: "optional" }));

// Receive streaming chunks
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "chunk") process.stdout.write(data.content);
  if (data.type === "done") console.log("\n[complete]");
  if (data.type === "error") console.error(data.message);
};
```

### HTTP REST API

```bash
# Send message
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"content": "What is 2+2?", "userId": "user_123"}'

# Stream via SSE
curl -N https://yourdomain.com/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"content": "Write me a poem"}'
```

---

## CLI

The CLI channel is always available. It requires no configuration.

```bash
# Interactive chat
arivuclaw chat

# Single message
arivuclaw chat --message "What is the capital of France?"

# With a specific skill
arivuclaw chat --skill calculator --message "sin(pi/4)"

# Pipe input
echo "Summarise this" | cat - README.md | arivuclaw chat --pipe

# JSON output
arivuclaw chat --json --message "List prime numbers under 20"
```

### CLI Options

| Flag | Description |
|---|---|
| `--provider <name>` | Override the configured provider |
| `--model <name>` | Override the model |
| `--skill <name>` | Pre-activate a skill |
| `--mode <mode>` | Override execution mode |
| `--no-memory` | Disable memory for this session |
| `--json` | Output raw JSON response |
| `--pipe` | Read stdin as part of message |
| `--session <id>` | Resume a specific session |

---

## Signal

**Prerequisite:** [signal-cli](https://github.com/AsamK/signal-cli) must be installed and registered.

### Setup

```bash
# Install signal-cli
# Register your phone number with Signal
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <code>

export SIGNAL_NUMBER=+1234567890
export SIGNAL_CLI_PATH=/usr/local/bin/signal-cli
```

```typescript
channels: {
  signal: {
    enabled: true,
    phoneNumber: process.env.SIGNAL_NUMBER,
    signalCliPath: process.env.SIGNAL_CLI_PATH ?? "signal-cli",
    dataPath: "auth/signal",
  }
}
```

### Notes

- Signal does not support message editing; streaming is simulated with a single final message.
- Group messages are supported.
- Arivumaiyam AI runs `signal-cli` as a subprocess using its `jsonRpc` interface.

---

## iMessage

**Prerequisite:** macOS only. Requires Full Disk Access for the terminal app.

### Setup

```typescript
channels: {
  imessage: {
    enabled: true,
    selfNumber: process.env.IMESSAGE_NUMBER,  // your Apple ID phone or email
    pollingIntervalMs: 2000,
  }
}
```

### Notes

- Uses AppleScript to read from and send to `Messages.app`.
- Only works on macOS while the Messages app is open.
- No streaming (single final message delivery).
- Requires granting Full Disk Access to Terminal / your shell.

---

## Microsoft Teams

**Library:** [botframework-sdk](https://github.com/microsoft/botframework-sdk)

### Setup

```bash
# Register a bot at dev.botframework.com
# Create an Azure Bot resource
export TEAMS_APP_ID=...
export TEAMS_APP_PASSWORD=...
```

```typescript
channels: {
  teams: {
    enabled: true,
    appId: process.env.TEAMS_APP_ID,
    appPassword: process.env.TEAMS_APP_PASSWORD,
    port: 3006,
    messagingEndpoint: "https://yourdomain.com/api/teams/messages",
  }
}
```

### Adaptive Cards

Arivumaiyam AI automatically renders rich content (tables, code) as Adaptive Cards in Teams.

### Streaming

Teams supports activity updates. Arivumaiyam AI sends a `typing` activity, then replaces it with the completed response.

---

## Matrix

**Library:** [matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk)

### Setup

```bash
export MATRIX_HOMESERVER=https://matrix.org
export MATRIX_ACCESS_TOKEN=syt_...
export MATRIX_USER_ID=@arivuclaw:matrix.org
```

```typescript
channels: {
  matrix: {
    enabled: true,
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID,
    storePath: "auth/matrix",
  }
}
```

### Notes

- Supports E2E encryption rooms (via libolm).
- Streaming via event stream updates.
- Invite the bot to a room: `/invite @arivuclaw:matrix.org`

---

## Cross-Channel Identity

Arivumaiyam AI maintains a single `UserIdentity` across all channels. When a user on Telegram sends a message, and then the same person sends a message on Discord, Arivumaiyam AI recognises them as the same user — sharing memory, preferences, and conversation history.

### How it works

```typescript
// Automatic: Gateway.resolveUser() maps (channelType, channelUserId) → UserIdentity
// On first contact: a new UserIdentity is created
// Linking accounts: the user can say "link my Telegram account"
//   → agent sends a one-time code to both channels for verification
```

### Linking Accounts

```
User on Telegram: "Link my Discord account"
Agent: "Say 'arivuclaw link ABC123' on Discord within 5 minutes."
User on Discord: "arivuclaw link ABC123"
Agent: "Accounts linked! Your memory and preferences are now shared."
```

Programmatic linking:

```typescript
await gateway.resolveUser("telegram", "123456").then(user => {
  gateway.linkUserChannel(user.id, "discord", "987654321");
});
```

---

## Session Continuity

Sessions have a 30-minute sliding window. Starting a conversation on Telegram and continuing on Discord within 30 minutes uses the same session (same conversation history).

```typescript
// Configure session TTL
gateway: {
  sessionTtlMs: 1_800_000,    // 30 minutes (default)
}
```

Sessions are keyed by `userId` only (not by channel). Any channel event from the same user refreshes the TTL.

---

## Message Routing

The Gateway can route messages from one channel to another for the same user:

```typescript
// Route a message to a specific channel
await gateway.routeMessage(userId, "telegram", "Your scheduled report is ready.");

// Broadcast to all connected channels
await gateway.broadcastToUser(userId, "⚠️ Alert: disk usage > 90%");
```

This is used by the `reminder` and `automation` skills to deliver notifications on the user's preferred channel.

---

## Custom Channel Development

Implement the `ChannelAdapter` interface and register with the gateway:

```typescript
import type { ChannelAdapter, ChannelCapabilities, AgentResponse } from "arivuclaw/core/types";

export class IRCAdapter implements ChannelAdapter {
  channelType = "irc" as const;

  constructor(private config: { server: string; nick: string; channels: string[] }) {}

  async start(): Promise<void> {
    // Connect to IRC server, register event handlers
    // Call gateway.receive() for each incoming message
  }

  async stop(): Promise<void> { /* disconnect */ }

  async send(userId: string, response: AgentResponse): Promise<void> {
    // Send response.text to the IRC channel or PM
  }

  isConnected(): boolean { return this.connected; }

  getCapabilities(): ChannelCapabilities {
    return {
      streaming: false,
      fileUpload: false,
      richText: false,
      reactions: false,
      threads: false,
      maxMessageLength: 512,
    };
  }
}

// Register
const gateway = new Gateway({ ... });
gateway.registerChannel(new IRCAdapter({ server: "irc.libera.chat", nick: "arivuclaw", channels: ["#dev"] }));
```

Or register via the Plugin SDK:

```typescript
sdk.registerChannelPlugin({
  kind: "channel",
  channelType: "irc",
  adapter: new IRCAdapter({ ... }),
});
```

---

## Streaming Per Channel Type

| Channel | Streaming Method | Notes |
|---|---|---|
| Web | WebSocket chunk events | Real-time token delivery |
| Telegram | `editMessageText` | Batched at 800 ms intervals |
| Discord | `message.edit()` | Batched at 800 ms, rate-limit aware |
| Slack | `chat.update` | Batched at 1000 ms |
| CLI | `process.stdout.write` | Raw token stream |
| WhatsApp | Typing indicator + final | No mid-stream editing |
| Signal | Final message only | No mid-stream editing |
| iMessage | Final message only | No mid-stream editing |
| Teams | `typing` + `update` | Activity update on completion |
| Matrix | `m.room.message` update | Event replacement |

Configure global streaming behaviour:

```typescript
streaming: {
  enabled: true,
  bufferMs: 800,              // flush interval for edit-based channels
  maxChunkSize: 200,          // max chars per chunk (Web/CLI)
  disableForChannels: ["signal", "imessage"],  // force final-only
}
```

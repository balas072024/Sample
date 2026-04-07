# ArivuClaw

An open-source, intelligent AI agent framework that connects large language models to multiple messaging platforms. Successor to OpenClaw with unrestricted local execution, multiple LLM providers, and extensive skill capabilities.

> *"Arivu" (அறிவு) means wisdom/knowledge in Tamil*

## Tech Stack

- **Runtime:** Node.js >= 22.16.0, TypeScript 5.6.0
- **LLM Providers:** Anthropic Claude, OpenAI GPT, Google Gemini, Ollama (local), MiniMax, DeepSeek, Groq, Neural Brain
- **Channels:** CLI, Telegram, Discord, Slack, WhatsApp, Web (REST + WebSocket)
- **Memory:** HNSWLIB vector store with RAG
- **Testing:** Jest + ts-jest
- **Process Manager:** PM2

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Build TypeScript
npm run build

# Run interactive setup wizard
npm run onboard

# Start (all configured channels)
npm start

# Or start in dev mode (CLI only)
npm run dev
```

## Environment Variables

### LLM Provider API Keys (use any or all)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | OpenAI GPT API key | [platform.openai.com](https://platform.openai.com) |
| `GOOGLE_API_KEY` | Google Gemini API key | [aistudio.google.com](https://aistudio.google.com) |
| `MINIMAX_API_KEY` | MiniMax API key | [api.minimax.chat](https://api.minimax.chat) |
| `DEEPSEEK_API_KEY` | DeepSeek API key | [platform.deepseek.com](https://platform.deepseek.com) |
| `GROQ_API_KEY` | Groq API key | [console.groq.com](https://console.groq.com) |

**Free providers (no key needed):** Ollama (local), Groq (free tier), DeepSeek (generous free tier)

### Messaging Channel Tokens

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | [@BotFather on Telegram](https://t.me/BotFather) |
| `DISCORD_BOT_TOKEN` | Discord bot token | [Discord Developer Portal](https://discord.com/developers) |
| `SLACK_BOT_TOKEN` | Slack bot token (xoxb-...) | [api.slack.com/apps](https://api.slack.com/apps) |
| `SLACK_APP_TOKEN` | Slack app token (xapp-...) | Same Slack app settings |
| `SLACK_SIGNING_SECRET` | Slack signing secret | Same Slack app settings |

### Integration Tokens

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_EMAIL` | Jira account email |
| `HOME_ASSISTANT_URL` | Home Assistant URL |
| `HOME_ASSISTANT_TOKEN` | Home Assistant long-lived token |

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ARIVUCLAW_MODE` | `unrestricted` | Execution mode: `unrestricted`, `local-admin`, `restricted` |
| `ARIVUCLAW_PROVIDER` | `anthropic` | Default LLM provider |
| `ARIVUCLAW_MODEL` | `claude-sonnet-4-6` | Default LLM model |
| `ARIVUCLAW_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `unrestricted` | Full system access, no sandbox, no rate limits | Personal laptop |
| `local-admin` | Elevated access with basic safety nets | Dev machines |
| `restricted` | Sandboxed, rate-limited, approval workflows | Shared/network deployment |

## NPM Scripts

```bash
npm run build          # Compile TypeScript
npm run dev            # Dev mode with ts-node
npm start              # Run compiled CLI
npm test               # Run all tests
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests
npm run lint           # ESLint
npm run format         # Prettier
npm run onboard        # Interactive setup wizard
```

## CLI Commands

```bash
arivuclaw              # Start with all configured channels
arivuclaw chat         # CLI-only chat mode
arivuclaw onboard      # Interactive setup wizard
arivuclaw skills list  # List installed skills
arivuclaw status       # Show system status
```

## Architecture

```
Client (Telegram/Discord/Slack/WhatsApp/Web/CLI)
    |
    v
  Gateway (Message Router)
    |
    +-- Channel Adapters (6 platforms)
    +-- Agent Runtime (AI processing)
    +-- Skill Registry (37+ skills)
    +-- Security Guard (sandbox, rate limits)
    +-- Vector Memory (RAG)
    |
    v
  LLM Providers (8 providers)
```

## 37+ Built-in Skills

File operations, code execution, web browsing, browser automation, database ops (SQLite/Postgres/MySQL/MongoDB/Redis), Git, Docker, network scanning, media processing, smart home, and more.

## License

MIT

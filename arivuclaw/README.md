# 🦀 ArivuClaw

**Your Intelligent AI Assistant. Secure. Composable. Multi-platform.**

> *"Arivu" (அறிவு) means wisdom/knowledge in Tamil*

ArivuClaw is an open-source AI agent framework that connects any LLM to your messaging platforms — WhatsApp, Telegram, Discord, Slack, and more. It's inspired by [OpenClaw](https://github.com/openclaw/openclaw) but rebuilt with security, composability, and developer experience as first-class priorities.

---

## Why ArivuClaw over OpenClaw?

| Feature | OpenClaw | ArivuClaw |
|---------|----------|-----------|
| **Security** | CVE-2026-25253 (gateway URL injection) | URL validation, sandboxed execution, path traversal prevention |
| **Skill Composition** | Flat, isolated skills | Typed interfaces, dependency resolution, skill composition |
| **Memory** | External plugin required | Built-in vector store with RAG, semantic search, and fact extraction |
| **Prompt Injection** | Vulnerable | Built-in detection heuristics |
| **Rate Limiting** | Basic | Per-user, per-channel, and global with configurable windows |
| **Permission Model** | Broad permissions | Fine-grained RBAC (owner/admin/user/guest) with per-tool permissions |
| **Hot Reload** | Skills watcher | Skills + config hot reload with dependency re-resolution |
| **Memory Decay** | No | Automatic decay — old unused memories fade, frequently accessed ones persist |
| **Fact Extraction** | No | Automatic extraction of user facts from conversations |
| **Cross-Channel** | Shared sessions | Unified identity with cross-channel message routing |
| **Local Models** | Via Ollama plugin | First-class Ollama support with auto-detection |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ArivuClaw Gateway                    │
│                    (WebSocket Server)                     │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ WhatsApp │ Telegram │ Discord  │  Slack   │  Web / CLI  │
│ (Baileys)│ (grammY) │(discord.js│ (Bolt)  │ (WS+REST)   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘
     │          │          │          │             │
     └──────────┴──────────┴──────────┴─────────────┘
                           │
                    ┌──────┴──────┐
                    │ Agent Runtime│
                    │  (AI Loop)   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────┴──────┐ ┌────┴────┐ ┌───────┴───────┐
     │ Skill System │ │ Memory  │ │   Security    │
     │ (Composable) │ │  (RAG)  │ │   (Sandbox)   │
     └──────────────┘ └─────────┘ └───────────────┘
```

## Quick Start

### Install

```bash
npm install -g arivuclaw
```

### First-Time Setup

```bash
arivuclaw onboard
```

This interactive wizard will:
1. Choose your AI provider (Anthropic, OpenAI, Ollama, Google)
2. Configure your API key
3. Select messaging channels
4. Set security preferences
5. Install starter skills

### Start Chatting

```bash
# CLI chat mode
arivuclaw chat

# Start all configured channels
arivuclaw start

# Check status
arivuclaw status
```

### Configuration

ArivuClaw looks for configuration in:
1. `./arivuclaw.config.json` (project-level)
2. `./.arivuclaw/config.json` (project-level)
3. `~/.arivuclaw/config.json` (user-level)

Environment variables:
```bash
ANTHROPIC_API_KEY=sk-ant-...     # Anthropic API key
OPENAI_API_KEY=sk-...            # OpenAI API key
TELEGRAM_BOT_TOKEN=...           # Telegram bot token
DISCORD_BOT_TOKEN=...            # Discord bot token
ARIVUCLAW_PROVIDER=anthropic     # Default provider
ARIVUCLAW_MODEL=claude-sonnet-4-6  # Default model
ARIVUCLAW_LOG_LEVEL=info         # Log level
```

## Skills

ArivuClaw uses a composable skills system. Each skill is a directory with a `SKILL.md` file containing YAML frontmatter and instructions.

### Built-in Skills

| Skill | Description |
|-------|-------------|
| `web-browse` | Fetch and search web content |
| `file-ops` | Read, write, and search files |
| `code-exec` | Execute code and shell commands |
| `scheduler` | Set reminders and recurring tasks |
| `summarize` | Summarize text, URLs, and documents |

### Creating a Custom Skill

```
my-skill/
  SKILL.md
```

**SKILL.md:**
```yaml
---
name: my-skill
version: "1.0.0"
description: My custom skill
permissions:
  - network.http
tools:
  - name: my_tool
    description: Does something useful
    permissions:
      - network.http
    inputSchema:
      type: object
      properties:
        input:
          type: string
      required:
        - input
triggers:
  - type: keyword
    pattern: "my-trigger"
    priority: 5
dependencies:
  - skill: web-browse
    version: "1.0.0"
provides:
  - name: MyInterface
    version: "1.0"
    methods:
      - name: doSomething
        description: Does the thing
        inputSchema: {}
        outputSchema: {}
---

# My Skill

Instructions for the AI on how to use this skill.
```

### Skill Directories (Precedence)

1. `./skills/` — Workspace skills (highest priority)
2. `~/.arivuclaw/skills/` — User skills
3. Built-in skills (lowest priority)

## Security

ArivuClaw takes security seriously:

- **Sandboxed Execution**: All tool calls run in isolated contexts with declared permissions
- **URL Validation**: Gateway URLs are validated to prevent token theft (fixes OpenClaw's CVE-2026-25253)
- **Path Traversal Prevention**: File operations are restricted to allowed paths
- **Prompt Injection Detection**: Heuristic detection of injection attempts
- **Rate Limiting**: Per-user, per-channel, and global rate limits
- **RBAC**: Role-based access control (owner/admin/user/guest)
- **Memory Isolation**: Per-user memory with no cross-user leakage

## Supported Providers

| Provider | Models | Local? |
|----------|--------|--------|
| Anthropic | Claude Opus, Sonnet, Haiku | No |
| OpenAI | GPT-4o, o3, o4-mini | No |
| Ollama | Llama 3, Mistral, Phi, etc. | Yes |
| Google | Gemini 2.0 Flash/Pro | No |

## Development

```bash
# Clone
git clone https://github.com/arivuclaw/arivuclaw.git
cd arivuclaw

# Install dependencies
npm install

# Run in dev mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Project Structure

```
arivuclaw/
├── src/
│   ├── core/           # Gateway, Agent Runtime, Types
│   ├── channels/       # Channel adapters (WhatsApp, Telegram, etc.)
│   ├── skills/         # Skill registry and loader
│   ├── memory/         # Vector memory store with RAG
│   ├── security/       # Security guard and sandbox
│   ├── plugins/        # Provider plugins (Anthropic, OpenAI, Ollama)
│   ├── cli/            # CLI entry point and config
│   └── utils/          # Logger and utilities
├── skills/             # Built-in skills
├── tests/              # Unit and integration tests
├── config/             # Configuration templates
└── docs/               # Documentation
```

## License

MIT

## Credits

Inspired by [OpenClaw](https://github.com/openclaw/openclaw) by Peter Steinberger.
Built with wisdom (Arivu) and a focus on security, composability, and developer experience.

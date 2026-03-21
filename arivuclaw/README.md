# 🦀 Arivumaiyam AI

**Your Intelligent AI Assistant. Unrestricted. Composable. Multi-platform.**

> *"Arivu" (அறிவு) means wisdom/knowledge in Tamil*

Arivumaiyam AI is an open-source AI agent framework that connects any LLM to your messaging platforms — WhatsApp, Telegram, Discord, Slack, and more. Inspired by [OpenClaw](https://github.com/openclaw/openclaw) but rebuilt with **unrestricted local access**, more skills, more providers, and better security architecture.

---

## Why Arivumaiyam AI over OpenClaw?

| Feature | OpenClaw | Arivumaiyam AI |
|---------|----------|-----------|
| **Execution Mode** | Single mode | 3 modes: Unrestricted / Local-Admin / Restricted |
| **System Access** | Limited | Full elevated access (sudo, services, packages) |
| **LLM Providers** | 4-5 via plugins | 8 built-in: Anthropic, OpenAI, Ollama, MiniMax, DeepSeek, Groq, Google, Neural Brain |
| **Skills** | 53 bundled | **37+ built-in** skills covering all OpenClaw tools + extras |
| **Security** | CVE-2026-25253 | URL validation, sandboxed execution, prompt injection detection |
| **Skill Composition** | Flat, isolated | Typed interfaces, dependency resolution, skill composition |
| **Memory** | External plugin | Built-in RAG with vector search, fact extraction, memory decay |
| **Neural Brain** | No | Bio-inspired neural processing layer with associative memory |
| **Free Providers** | Ollama only | Ollama + Groq (free tier) + DeepSeek (free tier) |
| **System Tools** | Via exec skill | Native clipboard, screenshot, TTS, OCR, notifications |
| **Docker** | Via skill | Native Docker management with compose support |
| **Cost** | Free + API | Free + API (more free provider options) |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Arivumaiyam AI Gateway                        │
│              Mode: UNRESTRICTED / LOCAL-ADMIN / RESTRICTED     │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ WhatsApp │ Telegram │ Discord  │  Slack   │  Web / CLI       │
│ (Baileys)│ (grammY) │(discord.js│ (Bolt)  │ (WS+REST)        │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────────┬───────┘
     └──────────┴──────────┴──────────┴────────────────┘
                           │
                    ┌──────┴──────┐
                    │ Agent Runtime│
                    │  (AI Loop)   │
                    └──────┬──────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
┌─────┴──────┐   ┌────────┴────────┐   ┌──────┴──────┐
│ 37+ Skills │   │ Memory (RAG)    │   │  8 Providers │
│ Composable │   │ Vector + Facts  │   │  + Neural    │
└────────────┘   └─────────────────┘   └─────────────┘
```

## Quick Start (Local Laptop)

### Install

```bash
npm install -g arivuclaw
```

### First-Time Setup

```bash
arivuclaw onboard
```

### Start Chatting

```bash
# CLI chat mode (unrestricted by default)
arivuclaw chat

# Start all configured channels
arivuclaw start

# Check status (shows system info, providers, skills)
arivuclaw status

# List all installed skills
arivuclaw skills list
```

## Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `unrestricted` | **No limits.** Full system access, no sandbox, no rate limits, sudo allowed | Your personal laptop |
| `local-admin` | Elevated access with basic safety nets | Development machine |
| `restricted` | Sandboxed, rate-limited, approval workflows | Shared/network deployment |

Set via environment variable:
```bash
ARIVUCLAW_MODE=unrestricted  # Default
```

In unrestricted mode, Arivumaiyam AI can:
- Install/remove packages (`apt`, `brew`, `pacman`, etc.)
- Manage system services (`systemctl start/stop/restart`)
- Full filesystem access (read/write/delete anywhere)
- Run any shell command without restrictions
- Docker container management
- Access clipboard, take screenshots, play audio
- Send desktop notifications
- Control smart home devices

## Supported Providers (8 built-in)

| Provider | Models | Free Tier? | Local? |
|----------|--------|------------|--------|
| **Anthropic** | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 | No | No |
| **OpenAI** | GPT-4o, o3, o4-mini | No | No |
| **MiniMax** | MiniMax-Text-01, abab6.5s | Yes (limited) | No |
| **DeepSeek** | deepseek-chat, deepseek-coder, deepseek-reasoner | Yes (generous) | No |
| **Groq** | Llama 3.3 70B, Mixtral, Gemma | Yes (free) | No |
| **Google** | Gemini 2.0 Flash/Pro | No | No |
| **Ollama** | Llama 3, Mistral, Phi, Qwen, etc. | Yes (100% free) | Yes |
| **Neural Brain** | Bio-inspired hybrid (any backbone) | Uses backbone | Hybrid |

### Neural Brain Mode

Experimental bio-inspired neural processing inspired by [Cortical Labs' DishBrain](https://robohorizon.com/en-gb/magazine/2026/03/cortical-labs-brain-llm/). Adds:
- **Associative memory**: Learns from your interactions, recalls similar patterns
- **Neural plasticity**: Adapts over time — frequently used patterns strengthen
- **Memory decay**: Unused patterns fade naturally (like biological forgetting)
- Works on top of any backbone provider (Anthropic, OpenAI, Ollama, etc.)

```bash
ARIVUCLAW_PROVIDER=custom  # Activates Neural Brain
```

## Built-in Skills (37+)

All matching OpenClaw's 25 tools + 53 skills, and more:

### Core Tools (matching OpenClaw's 25 built-in tools)
| Skill | OpenClaw Equivalent | Description |
|-------|-------------------|-------------|
| `file-ops` | read, write, list, search | Full filesystem CRUD + glob search |
| `code-exec` | exec, python, node | Shell commands + script execution |
| `web-browse` | web_search, web_fetch, web_screenshot | Search, fetch, and analyze web |
| `browser-automation` | browser | Puppeteer/Playwright automation |
| `scheduler` | schedule, heartbeat | Reminders, cron jobs, intervals |
| `email-send` | email | Send/read emails (Gmail, SMTP) |
| `slack-integration` | slack | Full Slack: channels, threads |
| `discord` | discord | (built into channel adapter) |
| `github-integration` | github | Repos, PRs, issues, actions |
| `jira-integration` | jira | Issues, sprints, boards |
| `database` | database | SQLite, Postgres, MySQL, Mongo, Redis |
| `calculator` | calculator | Math, formulas, conversions |
| `date-time` | date_time | Timezones, countdowns, formatting |
| `image-lab` | image_gen | AI image generation (DALL-E, SD, local) |
| `pdf-tools` | pdf | Create, read, merge, split, convert |
| `zip-archive` | zip | Compress/extract (zip, tar, gzip, 7z) |
| `context-manager` | memory, context | Conversation + memory management |
| `heartbeat-monitor` | heartbeat | Background health monitoring |

### Developer Skills (matching OpenClaw's community skills)
| Skill | Description |
|-------|-------------|
| `code-review` | Analyze code quality, bugs, security |
| `debug-assistant` | Debug errors, stack traces |
| `test-generator` | Auto-generate unit/integration tests |
| `refactor-assistant` | Code improvements, modernization |
| `git-ops` | Full Git: clone, commit, push, branch, merge |
| `docker-ops` | Docker containers, images, compose |
| `api-builder` | Build, test, mock REST APIs |
| `api-monitor` | Monitor API health, uptime |
| `error-tracker` | Track/analyze application errors |
| `deployment-watcher` | Monitor CI/CD deployments |

### Productivity Skills
| Skill | Description |
|-------|-------------|
| `meeting-summary` | Summarize meetings, extract action items |
| `task-manager` | Todo lists, task tracking |
| `note-taking` | Personal knowledge base with search |
| `obsidian-notes` | Obsidian vault integration |
| `google-workspace` | Gmail, Calendar, Drive, Docs, Sheets |
| `summarize` | Summarize text, URLs, documents |
| `translate` | 100+ languages translation |
| `blog-writer` | Write blog posts, articles |
| `video-script` | Write video scripts, YouTube content |
| `news-digest` | Personalized news from RSS/APIs |

### System & Utility Skills
| Skill | Description |
|-------|-------------|
| `system-info` | Hardware info, process mgmt, packages, services |
| `clipboard` | Read/write system clipboard |
| `screenshot` | Capture screen, windows, regions |
| `audio-tts` | Text-to-speech, speech-to-text, audio conversion |
| `ocr` | Extract text from images (Tesseract) |
| `image-tools` | Resize, crop, convert, compress images |
| `password-gen` | Secure password & passphrase generation |
| `home-automation` | Home Assistant, MQTT smart home control |
| `whisper-stt` | OpenAI Whisper speech-to-text |
| `social-media` | Post to Twitter/X, LinkedIn, Instagram |
| `crypto-wallet` | Crypto prices, portfolio, alerts |

## Configuration

### Environment Variables
```bash
# Mode
ARIVUCLAW_MODE=unrestricted

# Provider (pick one)
ARIVUCLAW_PROVIDER=anthropic    # or openai, ollama, minimax, deepseek, groq, custom
ARIVUCLAW_MODEL=claude-sonnet-4-6

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
MINIMAX_API_KEY=...
DEEPSEEK_API_KEY=...
GROQ_API_KEY=...              # Free at console.groq.com
GOOGLE_API_KEY=...

# Channels
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
```

### Free Setup (Zero Cost)

For a completely free Arivumaiyam AI setup:

```bash
# 1. Install Ollama (free, local, private)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1

# 2. Set Arivumaiyam AI to use Ollama
export ARIVUCLAW_PROVIDER=ollama
export ARIVUCLAW_MODEL=llama3.1

# 3. Or use Groq (free tier, cloud-fast)
export ARIVUCLAW_PROVIDER=groq
export GROQ_API_KEY=your-free-key-from-console.groq.com
```

## Creating Custom Skills

```
my-skill/
  SKILL.md
```

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
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        input: { type: string }
      required: [input]
triggers:
  - type: keyword
    pattern: "my-trigger"
    priority: 5
dependencies:
  - skill: web-browse
    version: "1.0.0"
---

# My Skill Instructions
Tell the AI how to use this skill here.
```

## Development

```bash
git clone <your-repo-url>
cd arivuclaw
npm install
npm run dev      # Dev mode
npm test         # Run tests
npm run build    # Production build
```

## Project Structure

```
arivuclaw/
├── src/
│   ├── core/              # Gateway, Agent Runtime, Types
│   ├── channels/          # 6 channel adapters
│   ├── skills/            # Skill registry & loader
│   ├── memory/            # Vector memory with RAG
│   ├── security/          # Guard, Sandbox, Unrestricted mode
│   ├── plugins/providers/ # 8 LLM providers
│   ├── tools/             # System tools (clipboard, screenshot, etc.)
│   ├── cli/               # CLI, config, onboarding
│   └── utils/             # Logger
├── skills/                # 37+ built-in skills
├── tests/                 # Unit & integration tests
├── config/                # Configuration templates
└── docs/                  # Documentation
```

## License

MIT

## Credits

Inspired by [OpenClaw](https://github.com/openclaw/openclaw) by Peter Steinberger. Neural Brain concept inspired by [Cortical Labs' DishBrain](https://robohorizon.com/en-gb/magazine/2026/03/cortical-labs-brain-llm/).

Sources:
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Tools & Skills Guide](https://dev.to/roobia/what-are-openclaw-tools-and-skills-complete-guide-25-tools-53-skills-39o2)
- [OpenClaw Architecture](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills)
- [Cortical Labs Brain-LLM](https://robohorizon.com/en-gb/magazine/2026/03/cortical-labs-brain-llm/)

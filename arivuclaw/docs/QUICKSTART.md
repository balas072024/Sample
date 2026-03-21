# Arivumaiyam AI Quickstart Guide

Get Arivumaiyam AI running in under 5 minutes.

## Prerequisites

- Node.js 22.16+ (or Node 24 recommended)
- An LLM API key (or Ollama for free local models)

## Install

```bash
npm install -g arivuclaw
```

## Option 1: Interactive Setup

```bash
arivuclaw onboard
```

Follow the wizard to:
1. Choose your provider (Anthropic/OpenAI/Ollama/MiniMax/DeepSeek/Groq)
2. Enter your API key
3. Select channels (CLI, Web, WhatsApp, Telegram, Discord, Slack)
4. Start chatting!

## Option 2: Quick Start with Environment Variables

```bash
# Using Anthropic Claude
export ANTHROPIC_API_KEY=sk-ant-your-key
arivuclaw chat

# Using free Groq
export GROQ_API_KEY=your-free-key
export ARIVUCLAW_PROVIDER=groq
arivuclaw chat

# Using free local Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1
export ARIVUCLAW_PROVIDER=ollama
arivuclaw chat

# Using MiniMax (free tier)
export MINIMAX_API_KEY=your-key
export ARIVUCLAW_PROVIDER=minimax
arivuclaw chat

# Using DeepSeek (free tier)
export DEEPSEEK_API_KEY=your-key
export ARIVUCLAW_PROVIDER=deepseek
arivuclaw chat
```

## Option 3: Start All Channels

```bash
# Configure channels in .arivuclaw/config.json or env vars
export TELEGRAM_BOT_TOKEN=your-bot-token
arivuclaw start
```

## CLI Commands

```bash
arivuclaw chat          # CLI chat mode
arivuclaw start         # Start all channels
arivuclaw status        # System status + provider info
arivuclaw skills list   # List all 112 skills
arivuclaw onboard       # Setup wizard
arivuclaw help          # Show help
```

## What You Can Do

Once running, just talk naturally:

```
🦀 You: scan my network with nmap
🦀 You: generate a Python REST API with auth
🦀 You: translate this to Tamil
🦀 You: create a docker-compose for postgres + redis
🦀 You: summarize this PDF
🦀 You: take a screenshot and OCR the text
🦀 You: generate music for a lo-fi study playlist
🦀 You: review my code for security issues
🦀 You: set a reminder for 3pm
🦀 You: check bitcoin price
```

## Next Steps

- [Architecture](./ARCHITECTURE.md) — How Arivumaiyam AI works
- [Skills Guide](./SKILLS-GUIDE.md) — Create custom skills
- [Providers Guide](./PROVIDERS-GUIDE.md) — Configure LLM providers
- [Channels Guide](./CHANNELS-GUIDE.md) — Connect messaging platforms
- [Security Guide](./SECURITY-GUIDE.md) — Configuration and modes
- [Deployment Guide](./DEPLOYMENT-GUIDE.md) — Deploy to production
- [API Reference](./API-REFERENCE.md) — Complete API docs

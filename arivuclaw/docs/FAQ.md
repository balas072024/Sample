# Arivumaiyam AI FAQ

## General

### What is Arivumaiyam AI?
Arivumaiyam AI ("Arivu" = wisdom in Tamil) is an open-source AI agent framework that connects any LLM to your messaging platforms and gives you full control over your system. It has 112 built-in skills, 8 LLM providers, 10 messaging channels, and runs in unrestricted mode on your laptop.

### How is it different from OpenClaw?
| Feature | OpenClaw | Arivumaiyam AI |
|---------|----------|-----------|
| Skills | 53 bundled | 112 built-in |
| Providers | 4-5 | 8 + Neural Brain |
| Security | CVE-2026-25253 | Fixed, plus container sandbox |
| Skill Composition | Flat | Dependency resolution + typed interfaces |
| Memory | External plugin | Built-in RAG + fact extraction + decay |
| MCP | Via plugin | Native MCP Server/Client/Bridge |
| Video/Audio Gen | Via skills | 14 built-in (Sora, Wan, Fish Speech, MusicGen) |
| Kali Linux | Community skills | 40 built-in security tools |
| Vision | Via provider | Dedicated multimodal processor |
| Free Providers | Ollama | Ollama + Groq + DeepSeek + MiniMax |
| i18n | English | 10 languages |

### Is it free?
Yes, MIT licensed. You only pay for API credits if using cloud providers. Ollama, Groq (free tier), and DeepSeek (free tier) are completely free.

### What languages does Arivumaiyam AI support?
Interface: English, Tamil, Hindi, Spanish, French, German, Japanese, Chinese, Korean, Arabic. LLM responses: All languages supported by your chosen model.

## Setup

### Which provider should I use?
- **Best quality**: Anthropic Claude Sonnet 4.6
- **Best free**: Ollama with Llama 3.1 (local, private)
- **Best free cloud**: Groq (ultra-fast, generous free tier)
- **Best value**: DeepSeek (very cheap, good quality)
- **Fastest**: Groq (hardware-accelerated inference)
- **Most creative**: Neural Brain hybrid mode

### Can I use multiple providers?
Yes. Use Model Tiering to route simple queries to cheap models and complex ones to premium models. Saves 40-60% on API costs.

### How do I connect WhatsApp?
1. Enable WhatsApp in config: `channels: [{ type: "whatsapp", enabled: true }]`
2. Run `arivuclaw start`
3. Scan the QR code displayed in terminal
4. Send a message to your number — Arivumaiyam AI responds

### Does it work offline?
Yes, with Ollama. Install Ollama, pull a model, set `ARIVUCLAW_PROVIDER=ollama`, and everything runs 100% locally with no internet.

## Skills

### How many skills are there?
112 built-in: 48 general, 40 Kali Linux security, 14 video/audio, 10 AI/SE.

### Can I create custom skills?
Yes. Create a `skills/my-skill/SKILL.md` file with YAML frontmatter. See the Skills Guide.

### Do skills auto-activate?
Yes. Skills have trigger patterns (keywords, regex). When your message matches, the relevant skills activate automatically.

## Security

### Is unrestricted mode safe?
On YOUR OWN laptop/network: yes. Unrestricted mode gives Arivumaiyam AI the same access you have. Never expose unrestricted mode on a public network.

### Can I add restrictions?
Yes. Switch to `restricted` mode in config, or use the Guardrails system to require approval for specific operations.

## Architecture

### What is MCP?
Model Context Protocol — the 2026 standard for AI agent tool integration. Arivumaiyam AI can expose its tools as MCP servers and connect to 13,000+ external MCP tools.

### What is Neural Brain?
A bio-inspired processing layer that adds associative memory and neural plasticity on top of any LLM backbone. It learns from your interactions and recalls similar patterns.

### Can multiple users share one Arivumaiyam AI?
Yes. Each user gets isolated sessions and memory. Cross-channel identity linking lets one user seamlessly switch between WhatsApp, Telegram, etc.

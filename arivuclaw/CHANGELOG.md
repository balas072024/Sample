# Changelog

All notable changes to Arivumaiyam AI are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-03-21

### Added

#### Core Architecture
- Gateway with hub-and-spoke architecture, WebSocket control plane
- Agent Runtime with multi-turn AI loop, tool orchestration, RAG memory injection
- Composable Skills system with dependency resolution, typed interfaces, hot-reload
- Vector Memory Store with semantic search, fact extraction, memory decay
- Unrestricted / Local-Admin / Restricted execution modes

#### LLM Providers (8)
- Anthropic (Claude Opus 4.6, Sonnet 4.6, Haiku 4.5)
- OpenAI (GPT-4o, o3, o4-mini)
- Ollama (Llama 3, Mistral, Phi — 100% free, local)
- MiniMax (MiniMax-Text-01, abab6.5s — free tier)
- DeepSeek (deepseek-chat, deepseek-coder — free tier)
- Groq (Llama 3.3 70B, Mixtral — free tier, ultra-fast)
- Google (Gemini 2.0 Flash/Pro)
- Neural Brain (bio-inspired hybrid with associative memory and plasticity)

#### Messaging Channels (10)
- WhatsApp (Baileys), Telegram (grammY), Discord (discord.js)
- Slack (Bolt), Web (WebSocket + REST), CLI (Terminal)
- Signal (signal-cli), iMessage (macOS), Microsoft Teams, Matrix

#### Skills (112)
- **General (48)**: file-ops, code-exec, web-browse, scheduler, email, git, docker, database, PDF, image, translate, OCR, clipboard, screenshot, TTS, summarize, notes, home automation, API builder, password gen, calculator, date-time, and more
- **Kali Linux Security (40)**: nmap, metasploit, burpsuite, sqlmap, wireshark, aircrack, john, hashcat, hydra, bloodhound, impacket, crackmapexec, nuclei, gobuster, ffuf, volatility, autopsy, steganography, and more
- **Video/Audio Generation (14)**: Sora 2, Wan 2.2, HunyuanVideo, CogVideoX, LTX-Video, Mochi, Fish Speech, CosyVoice, MusicGen, Amphion, voice clone, sound effects, video editor, audio editor
- **AI/Software Engineering (10)**: auto-coder, auto-architect, auto-debugger, auto-reviewer, auto-tester, recursive-agent, multi-agent-orchestrator, self-improving-agent, project-scaffolder, dependency-manager

#### Infrastructure (24 modules)
- MCP Server/Client/Bridge (Model Context Protocol)
- Vision/Multimodal processor
- Plugin SDK with 7 extension points
- Web UI Dashboard (dark theme)
- Streaming response manager + Channel streamer
- A2A Protocol (Agent-to-Agent, Google ADK compatible)
- Automation Engine (cron, webhooks, events, daily briefings)
- Telemetry Service (audit logs, metrics, tracing)
- Health Dashboard (real-time metrics)
- Model Tiering (router/standard/premium cost optimization)
- Guardrails (owner-controlled, auto-approve in unrestricted mode)
- Skill Marketplace client
- OAuth2 Manager (Google, GitHub, Slack, Microsoft, Discord, Spotify)
- Webhook Receiver (GitHub, Stripe, Slack HMAC verification)
- Container Sandbox (Docker isolation)
- Canvas Renderer (tables, charts, Mermaid diagrams, code blocks)
- i18n (10 languages: en, ta, hi, es, fr, de, ja, zh, ko, ar)
- Backup/Restore Manager
- File Upload Handler

#### Testing
- 14 test suites, 1153 tests, 100% pass rate
- Covers: skills validation, gateway, providers, security, system tools, skill loader, config, logger, sandbox, integration, all 24 gap modules

#### Documentation
- README, ARCHITECTURE, API Reference, Skills Guide, Providers Guide
- Security Guide, Deployment Guide, Channels Guide
- CHANGELOG, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT

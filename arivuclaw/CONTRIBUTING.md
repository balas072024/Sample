# Contributing to ArivuClaw

Thank you for your interest in contributing to ArivuClaw!

## Getting Started

```bash
git clone <repo-url>
cd arivuclaw
npm install --legacy-peer-deps
npm run dev
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make changes** and add tests
4. **Run tests**: `npm test` (must be 100% pass)
5. **Type-check**: `npx tsc --noEmit` (must be 0 errors)
6. **Commit**: `git commit -m "Add my feature"`
7. **Push**: `git push origin feature/my-feature`
8. **Create a Pull Request**

## Project Structure

```
src/
├── core/           # Gateway, Agent Runtime, Types, Model Tiering, Guardrails
├── channels/       # 10 channel adapters (WhatsApp, Telegram, Discord, etc.)
├── skills/         # Skill registry, loader
├── memory/         # Vector memory store with RAG
├── security/       # Guard, Sandbox, Unrestricted mode, Container sandbox
├── plugins/        # Provider plugins (8 LLMs), Plugin SDK
├── mcp/            # Model Context Protocol server/client/bridge
├── vision/         # Multimodal image/document processor
├── streaming/      # Streaming manager, channel streamer
├── a2a/            # Agent-to-Agent protocol
├── automations/    # Automation engine
├── observability/  # Telemetry, health dashboard
├── marketplace/    # Skill marketplace client
├── oauth/          # OAuth2 manager
├── webhooks/       # Webhook receiver
├── canvas/         # Rich output renderer
├── i18n/           # Internationalization
├── backup/         # Backup/restore manager
├── ui/             # Web UI dashboard
├── tools/          # System tools
├── cli/            # CLI entry point, config, onboarding
└── utils/          # Logger
```

## Adding a New Skill

1. Create a directory under `skills/your-skill-name/`
2. Create `SKILL.md` with YAML frontmatter and markdown instructions
3. See `docs/SKILLS-GUIDE.md` for the full format

## Adding a New Provider

1. Create `src/plugins/providers/your-provider.ts`
2. Implement the `LLMProvider` interface
3. Add to `src/cli/index.ts` in `createProvider()`
4. Add config defaults to `src/cli/config.ts`

## Adding a New Channel

1. Create `src/channels/your-channel.ts`
2. Extend `BaseChannel`
3. Implement `connect()`, `disconnect()`, `doSendMessage()`
4. Add to `src/cli/index.ts` in `createChannelAdapter()`

## Code Style

- TypeScript strict mode
- Use `.js` extensions on relative imports (Node16 module resolution)
- Use `import type` for type-only imports
- Use `Logger.create("module-name")` for logging

## Testing

- Tests live in `tests/unit/`
- Use Jest with ts-jest
- All PRs must maintain 100% test pass rate
- Run `npm test` before submitting

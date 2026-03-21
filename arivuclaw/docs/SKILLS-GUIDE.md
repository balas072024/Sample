# Arivumaiyam AI — Skills Development Guide

> 112 bundled skills across 4 categories. Every skill is a `SKILL.md` file — YAML frontmatter + markdown body.

---

## SKILL.md Format

Each skill lives in its own directory inside a skills folder. The directory name is the skill's identifier.

```
skills/
└── my-weather/
    └── SKILL.md
```

### Full SKILL.md Template

```markdown
---
name: my-weather
version: 1.0.0
description: Fetch current weather for any city
author: Your Name
category: general
enabled: true

# Permissions required to execute this skill
permissions:
  - network

# Skills this skill depends on (optional)
dependencies:
  - http-client

# Typed interfaces this skill exposes (optional)
provides:
  - name: WeatherProvider
    version: "1"
    methods:
      - getCurrentWeather(city: string): WeatherData

# Typed interfaces this skill requires (optional)
requires: []

# Trigger definitions — how the agent activates this skill
triggers:
  - type: keyword
    value: weather
    priority: 10
  - type: regex
    pattern: "what('s| is) the weather (in|for) .+"
    priority: 20
  - type: intent
    description: "User wants to know current weather conditions"
    priority: 5
  - type: schedule
    cron: "0 7 * * *"            # 07:00 daily digest
    action: weather_daily_brief
  - type: event
    eventName: location.updated  # internal bus event

# Tool definitions exposed to the LLM
tools:
  - name: get_weather
    description: Get current weather for a city
    inputSchema:
      type: object
      properties:
        city:
          type: string
          description: City name or coordinates
        units:
          type: string
          enum: [metric, imperial, kelvin]
          default: metric
      required:
        - city
    permissions:
      - network

  - name: get_forecast
    description: Get 5-day weather forecast
    inputSchema:
      type: object
      properties:
        city: { type: string }
        days:  { type: integer, minimum: 1, maximum: 7, default: 5 }
      required:
        - city
---

## Weather Skill

You have access to real-time weather data. When a user asks about weather:

1. Call `get_weather` with the city name.
2. Present temperature, conditions, humidity, and wind speed clearly.
3. If they ask for a forecast, call `get_forecast`.
4. Use metric units unless the user specifies otherwise or is in the US.

Always acknowledge uncertainty for distant future forecasts.
```

---

## Frontmatter Fields Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Unique skill identifier (slug) |
| `version` | string | Yes | SemVer |
| `description` | string | Yes | One-line summary |
| `author` | string | No | Author name or org |
| `category` | string | No | `general` \| `kali` \| `av` \| `ai` |
| `enabled` | boolean | No | Default `true` |
| `permissions` | string[] | No | `network` \| `filesystem` \| `shell` \| `admin` |
| `dependencies` | string[] | No | Skill names this skill depends on |
| `provides` | Interface[] | No | Typed interfaces this skill exposes |
| `requires` | Interface[] | No | Typed interfaces this skill consumes |
| `triggers` | Trigger[] | No | Activation conditions |
| `tools` | Tool[] | No | LLM-callable tool definitions |

---

## Tool Definition with inputSchema

Tools follow the JSON Schema draft-07 `inputSchema`:

```yaml
tools:
  - name: run_query
    description: Execute a database query and return results
    inputSchema:
      type: object
      properties:
        sql:
          type: string
          description: SQL query to execute
          maxLength: 4096
        database:
          type: string
          description: Database name
          default: main
        limit:
          type: integer
          minimum: 1
          maximum: 1000
          default: 100
          description: Max rows to return
        format:
          type: string
          enum: [json, csv, table]
          default: json
      required:
        - sql
      additionalProperties: false
    permissions:
      - filesystem
```

The LLM sees the `inputSchema` verbatim when deciding how to call the tool.

---

## Trigger Types

### keyword

Activated when the incoming message contains the exact keyword (case-insensitive, word boundary).

```yaml
triggers:
  - type: keyword
    value: nmap
    priority: 10
```

### regex

Activated when the message matches a regular expression.

```yaml
triggers:
  - type: regex
    pattern: "(scan|enumerate|probe)\\s+(network|host|port)"
    flags: i                    # case-insensitive
    priority: 15
```

### intent

The `SkillRegistry` sends the message to a lightweight LLM classifier. The `description` is used as the intent label.

```yaml
triggers:
  - type: intent
    description: "User wants to perform a network security scan"
    threshold: 0.7              # classification confidence threshold
    priority: 5
```

### schedule

Executes the skill's nominated action on a cron schedule. Runs independently of user messages.

```yaml
triggers:
  - type: schedule
    cron: "0 */6 * * *"         # every 6 hours
    action: health_check        # maps to a tool name
    targetUserId: owner         # special: delivers to owner
    timezone: UTC
```

### event

Activated when an internal bus event fires.

```yaml
triggers:
  - type: event
    eventName: file.uploaded
    action: process_upload
```

### Trigger Priority

Higher `priority` values match first. Default is `0`. The runtime collects all matching skills before the LLM call.

---

## Skill Composition

### Dependencies

```yaml
# child-skill/SKILL.md
dependencies:
  - http-client
  - json-parser
```

The `SkillLoader` performs a topological sort. If `http-client` is missing, the child skill fails to load with a clear error. Circular dependencies are detected and rejected.

### Typed Interfaces

Skills can expose typed interfaces for other skills to consume:

```yaml
# provider skill
provides:
  - name: StorageProvider
    version: "1"
    methods:
      - read(path: string): Promise<string>
      - write(path: string, data: string): Promise<void>

# consumer skill
requires:
  - name: StorageProvider
    version: "^1"
```

The loader injects the concrete implementation at activation time. Version matching follows semver ranges.

---

## Skill Precedence

The `SkillLoader` scans directories in this order. Later entries override earlier ones for the same `name`:

1. Bundled skills (`./skills/` in the package)
2. User skills (`~/.arivuclaw/skills/`)
3. Workspace skills (`./skills/` in the project directory, or `skillDirs` config)

To override a bundled skill named `calculator`, create `./skills/calculator/SKILL.md` in your workspace.

---

## Hot-Reload

The `SkillRegistry` watches all skill directories with a filesystem watcher (debounced 300 ms). On any change to a `SKILL.md` file:

1. The file is re-parsed and validated.
2. If valid, the old skill registration is replaced atomically.
3. Active sessions are not interrupted; they pick up the new definition on the next message.
4. If invalid, the old registration is kept and a warning is logged.

```typescript
// Enable in config
const registry = new SkillRegistry({ hotReload: true, watchDebounceMs: 300 });
await registry.loadSkills('./skills');
```

---

## Creating a Custom Skill — Step-by-Step Tutorial

### Step 1: Create the directory

```bash
mkdir -p ./skills/github-issues
```

### Step 2: Write SKILL.md

```markdown
---
name: github-issues
version: 1.0.0
description: Create and query GitHub issues via the GitHub API
author: Your Name
category: general
permissions:
  - network
triggers:
  - type: keyword
    value: github
    priority: 10
  - type: intent
    description: "User wants to create or view GitHub issues"
    priority: 5
tools:
  - name: create_github_issue
    description: Create a new GitHub issue
    inputSchema:
      type: object
      properties:
        owner:  { type: string, description: "Repository owner" }
        repo:   { type: string, description: "Repository name" }
        title:  { type: string, description: "Issue title" }
        body:   { type: string, description: "Issue body (markdown)" }
        labels: { type: array, items: { type: string } }
      required: [owner, repo, title]
  - name: list_github_issues
    description: List open issues for a repository
    inputSchema:
      type: object
      properties:
        owner:  { type: string }
        repo:   { type: string }
        state:  { type: string, enum: [open, closed, all], default: open }
        limit:  { type: integer, default: 10 }
      required: [owner, repo]
---

## GitHub Issues Skill

You can create and query GitHub issues on behalf of the user.

Authentication: use the `GITHUB_TOKEN` environment variable automatically. If it is not set, ask the user for their token.

When creating an issue:
- Use a clear, descriptive title.
- Format the body in markdown.
- Suggest relevant labels based on context.

When listing issues, present them in a readable table with number, title, and author.
```

### Step 3: Implement the tool execution

Arivumaiyam AI's `SandboxExecutor` handles `http_request` natively. Reference environment variables directly in the markdown instructions — the LLM will construct the appropriate HTTP call using the `http_request` built-in tool or your custom executor.

For custom execution logic, create a plugin:

```typescript
// skills/github-issues/executor.ts
import type { PluginSDK } from "arivuclaw/plugins/sdk";

export function activate(sdk: PluginSDK) {
  sdk.registerToolPlugin({
    kind: "tool",
    tools: [], // tools already declared in SKILL.md
    execute: async (toolName, input) => {
      const token = process.env.GITHUB_TOKEN;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      if (toolName === "create_github_issue") {
        const res = await fetch(
          `https://api.github.com/repos/${input.owner}/${input.repo}/issues`,
          { method: "POST", headers, body: JSON.stringify({ title: input.title, body: input.body, labels: input.labels }) }
        );
        return res.json();
      }

      if (toolName === "list_github_issues") {
        const res = await fetch(
          `https://api.github.com/repos/${input.owner}/${input.repo}/issues?state=${input.state}&per_page=${input.limit}`,
          { headers }
        );
        return res.json();
      }
    },
  });
}
```

### Step 4: Test

```bash
# Interactive CLI test
npx arivuclaw chat --skill github-issues

# Unit test (Jest / Vitest)
import { SkillRegistry } from "arivuclaw/skills/registry";
const reg = new SkillRegistry();
await reg.loadSkills("./skills");
const skill = reg.getSkill("github-issues");
expect(skill).toBeDefined();
expect(skill!.tools).toHaveLength(2);
```

### Step 5: Publish to Marketplace (optional)

```bash
npx arivuclaw marketplace publish ./skills/github-issues --token $MARKETPLACE_TOKEN
```

---

## Full Skill Catalog

### General Skills (48)

| # | Name | Description | Triggers |
|---|---|---|---|
| 1 | calculator | Arithmetic and expression evaluation | keyword: calculate, math |
| 2 | web-search | DuckDuckGo / SerpAPI web search | keyword: search, find |
| 3 | weather | Current weather and forecasts | keyword: weather |
| 4 | wikipedia | Wikipedia article lookup | keyword: wikipedia, wiki |
| 5 | translator | Text translation (DeepL / Google) | keyword: translate |
| 6 | summarizer | Summarise long documents or URLs | keyword: summarize, tldr |
| 7 | code-exec | Execute Python / JS / Bash snippets | keyword: run, execute |
| 8 | file-manager | Read, write, list, delete files | keyword: file, folder |
| 9 | git-ops | Git clone, commit, push, diff | keyword: git |
| 10 | http-client | Make arbitrary HTTP requests | keyword: http, curl, fetch |
| 11 | json-parser | Parse, query, transform JSON | keyword: json, jq |
| 12 | csv-processor | Read, filter, aggregate CSV data | keyword: csv, spreadsheet |
| 13 | markdown-render | Render markdown to HTML or PDF | keyword: render, markdown |
| 14 | reminder | Set and deliver time-based reminders | keyword: remind, reminder |
| 15 | calendar | Google / Outlook calendar integration | keyword: calendar, schedule |
| 16 | email | Send and read email via IMAP/SMTP | keyword: email, mail |
| 17 | notes | Create and search personal notes | keyword: note, notes |
| 18 | task-manager | Create and track tasks / to-dos | keyword: task, todo |
| 19 | clipboard | Read / write system clipboard | keyword: clipboard, copy |
| 20 | screenshot | Capture and analyse screenshots | keyword: screenshot |
| 21 | ocr | Extract text from images | keyword: ocr, extract text |
| 22 | image-gen | Generate images via DALL-E / SD | keyword: generate image, draw |
| 23 | audio-transcribe | Transcribe audio files via Whisper | keyword: transcribe |
| 24 | text-to-speech | Convert text to speech audio | keyword: speak, tts |
| 25 | unit-converter | Convert units (length, weight, temp) | keyword: convert |
| 26 | currency | Live currency conversion | keyword: currency, exchange |
| 27 | time-zone | World time and timezone conversion | keyword: time, timezone |
| 28 | qr-code | Generate and decode QR codes | keyword: qr, qr code |
| 29 | url-shortener | Shorten and expand URLs | keyword: shorten, url |
| 30 | password-gen | Generate secure passwords | keyword: password |
| 31 | hash | Compute MD5, SHA-256, SHA-512 | keyword: hash, checksum |
| 32 | base64 | Encode / decode Base64 | keyword: base64 |
| 33 | regex-tester | Test and explain regex patterns | keyword: regex |
| 34 | diff | Show diff between two texts | keyword: diff, compare |
| 35 | template-engine | Render Jinja2 / Handlebars templates | keyword: template |
| 36 | data-viz | Generate charts from data | keyword: chart, plot, graph |
| 37 | news | Fetch latest news headlines | keyword: news, headlines |
| 38 | rss | Subscribe and read RSS/Atom feeds | keyword: rss, feed |
| 39 | maps | Geocoding and directions | keyword: map, directions |
| 40 | contacts | Manage contact list | keyword: contact |
| 41 | slack-ops | Slack message and channel ops | keyword: slack |
| 42 | github-ops | GitHub repos, PRs, issues | keyword: github |
| 43 | jira | Jira issue creation and tracking | keyword: jira |
| 44 | notion | Notion page read/write | keyword: notion |
| 45 | spotify | Spotify playback control | keyword: spotify, music |
| 46 | youtube | YouTube search and metadata | keyword: youtube |
| 47 | stock-price | Live stock and crypto prices | keyword: stock, price |
| 48 | math-solver | Symbolic math via SymPy | keyword: solve, equation |

### Kali Linux Skills (40)

| # | Name | Description | Triggers |
|---|---|---|---|
| 1 | nmap-scanner | Network port and service scan | keyword: nmap |
| 2 | nikto | Web server vulnerability scan | keyword: nikto |
| 3 | gobuster | Directory and DNS brute force | keyword: gobuster |
| 4 | hydra | Credential brute force | keyword: hydra |
| 5 | john-ripper | Password cracking | keyword: john |
| 6 | hashcat | GPU-accelerated hash cracking | keyword: hashcat |
| 7 | metasploit | Exploitation framework wrapper | keyword: metasploit, msf |
| 8 | burpsuite | HTTP proxy and interceptor | keyword: burp |
| 9 | sqlmap | SQL injection detection | keyword: sqlmap |
| 10 | aircrack-ng | Wi-Fi security auditing | keyword: aircrack |
| 11 | wireshark | Packet capture and analysis | keyword: wireshark |
| 12 | tcpdump | CLI packet capture | keyword: tcpdump |
| 13 | netcat | TCP/UDP swiss army knife | keyword: netcat, nc |
| 14 | socat | Multipurpose relay tool | keyword: socat |
| 15 | openssl | TLS/SSL certificate ops | keyword: openssl |
| 16 | gpg | GPG key and encryption ops | keyword: gpg |
| 17 | steghide | Steganography hide/extract | keyword: steghide |
| 18 | exiftool | Image/file metadata extraction | keyword: exiftool |
| 19 | binwalk | Firmware analysis and extraction | keyword: binwalk |
| 20 | strings | Extract printable strings from binary | keyword: strings |
| 21 | ltrace | Library call tracer | keyword: ltrace |
| 22 | strace | System call tracer | keyword: strace |
| 23 | gdb | GNU debugger wrapper | keyword: gdb |
| 24 | radare2 | Reverse engineering framework | keyword: r2, radare |
| 25 | ghidra | NSA decompiler wrapper | keyword: ghidra |
| 26 | volatility | Memory forensics | keyword: volatility |
| 27 | autopsy | Digital forensics platform | keyword: autopsy |
| 28 | maltego | OSINT link analysis | keyword: maltego |
| 29 | recon-ng | Web reconnaissance framework | keyword: recon-ng |
| 30 | theharvester | Email and domain harvesting | keyword: harvester |
| 31 | shodan | Shodan IoT search | keyword: shodan |
| 32 | masscan | High-speed port scanner | keyword: masscan |
| 33 | zmap | Internet-scale port scanner | keyword: zmap |
| 34 | enum4linux | SMB enumeration | keyword: enum4linux |
| 35 | smbclient | SMB file share access | keyword: smbclient |
| 36 | crackmapexec | Network pentesting suite | keyword: crackmapexec, cme |
| 37 | impacket | Windows protocol implementations | keyword: impacket |
| 38 | responder | LLMNR/NBT-NS poisoner | keyword: responder |
| 39 | beef | Browser exploitation framework | keyword: beef |
| 40 | social-engineer | Social engineering toolkit | keyword: set, social engineer |

### Audio/Video Skills (14)

| # | Name | Description | Triggers |
|---|---|---|---|
| 1 | ffmpeg | Video/audio transcoding | keyword: ffmpeg, convert video |
| 2 | yt-dlp | Download YouTube / media | keyword: download, yt-dlp |
| 3 | whisper | Speech-to-text transcription | keyword: transcribe, whisper |
| 4 | elevenlabs | AI voice generation | keyword: elevenlabs, voice clone |
| 5 | bark | Open-source TTS | keyword: bark, speak |
| 6 | stable-audio | Audio generation | keyword: generate audio |
| 7 | audiowaveform | Waveform visualisation | keyword: waveform |
| 8 | sox | Audio processing (trim, mix, fx) | keyword: sox, audio edit |
| 9 | video-caption | Auto-caption video files | keyword: caption, subtitle |
| 10 | video-summary | Summarise video content | keyword: summarise video |
| 11 | screen-recorder | Capture screen to video | keyword: record screen |
| 12 | obs-control | OBS Studio remote control | keyword: obs |
| 13 | podcast-gen | Generate podcast from text | keyword: podcast |
| 14 | music-gen | Generate music via MusicGen | keyword: generate music |

### AI/SE Skills (10)

| # | Name | Description | Triggers |
|---|---|---|---|
| 1 | code-review | AI-powered code review | keyword: review code |
| 2 | code-gen | Generate code from spec | keyword: generate code, write code |
| 3 | test-gen | Generate unit tests | keyword: generate tests |
| 4 | doc-gen | Generate API documentation | keyword: document, docstring |
| 5 | refactor | Refactor code intelligently | keyword: refactor |
| 6 | bug-finder | Static bug analysis | keyword: find bugs, debug |
| 7 | architecture-advisor | System design recommendations | keyword: architecture, design |
| 8 | prompt-optimizer | Optimise LLM prompts | keyword: optimize prompt |
| 9 | model-eval | Benchmark LLM responses | keyword: evaluate model |
| 10 | agent-builder | Scaffold new Arivumaiyam AI agents | keyword: create agent |

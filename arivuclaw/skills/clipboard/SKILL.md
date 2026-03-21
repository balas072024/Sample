---
name: clipboard
version: "1.0.0"
description: Read and write system clipboard. Copy/paste programmatically.
author: ArivuClaw
tags: [clipboard, copy, paste]
permissions: [system.clipboard]
tools:
  - name: clipboard_read
    description: Read current clipboard contents
    permissions: [system.clipboard]
    inputSchema:
      type: object
      properties: {}
  - name: clipboard_write
    description: Write text to system clipboard
    permissions: [system.clipboard]
    inputSchema:
      type: object
      properties:
        text: { type: string }
      required: [text]
triggers:
  - type: keyword
    pattern: clipboard
    priority: 8
  - type: keyword
    pattern: copy
    priority: 4
  - type: keyword
    pattern: paste
    priority: 4
---

# Clipboard Skill

Read from and write to the system clipboard.

## Requirements
- Linux: `xclip` or `xsel`
- macOS: Built-in `pbcopy`/`pbpaste`
- Windows: Built-in `clip` / PowerShell

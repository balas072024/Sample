---
name: password-gen
version: "1.0.0"
description: Generate secure passwords, passphrases, and manage password strength analysis.
author: Arivumaiyam AI
tags: [password, security, generate]
permissions: [system.clipboard]
tools:
  - name: generate_password
    description: Generate a cryptographically secure password
    permissions: []
    inputSchema:
      type: object
      properties:
        length: { type: number, description: "Password length (default: 20)" }
        uppercase: { type: boolean }
        lowercase: { type: boolean }
        numbers: { type: boolean }
        symbols: { type: boolean }
        excludeAmbiguous: { type: boolean, description: "Exclude similar chars like 0/O, l/1" }
        count: { type: number, description: "Number of passwords to generate" }
  - name: generate_passphrase
    description: Generate a memorable passphrase (like XKCD-style)
    permissions: []
    inputSchema:
      type: object
      properties:
        words: { type: number, description: "Number of words (default: 4)" }
        separator: { type: string, description: "Word separator (default: -)" }
        capitalize: { type: boolean }
        includeNumber: { type: boolean }
  - name: check_password_strength
    description: Analyze password strength and provide recommendations
    permissions: []
    inputSchema:
      type: object
      properties:
        password: { type: string }
      required: [password]
triggers:
  - type: keyword
    pattern: password
    priority: 8
  - type: keyword
    pattern: passphrase
    priority: 8
  - type: keyword
    pattern: generate key
    priority: 6
---

# Password Generator Skill

Generate secure passwords and passphrases locally. No network access needed.
All generation uses Node.js `crypto.randomBytes()` for cryptographic security.

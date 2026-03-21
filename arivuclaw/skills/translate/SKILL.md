---
name: translate
version: "1.0.0"
description: Translate text between 100+ languages. Detect language. Batch translate files.
author: ArivuClaw
tags:
  - translate
  - language
  - i18n
  - localization
permissions:
  - translate.text
  - network.http
tools:
  - name: translate_text
    description: Translate text from one language to another
    permissions: [translate.text]
    inputSchema:
      type: object
      properties:
        text: { type: string }
        from: { type: string, description: "Source language code (auto-detect if omitted)" }
        to: { type: string, description: "Target language code (e.g. 'es', 'ta', 'ja', 'fr')" }
      required: [text, to]
  - name: detect_language
    description: Detect the language of a text
    permissions: [translate.text]
    inputSchema:
      type: object
      properties:
        text: { type: string }
      required: [text]
  - name: translate_file
    description: Translate an entire file
    permissions: [translate.text, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        to: { type: string }
        outputPath: { type: string }
      required: [path, to, outputPath]
triggers:
  - type: keyword
    pattern: translate
    priority: 9
  - type: keyword
    pattern: translation
    priority: 8
  - type: regex
    pattern: "in (tamil|hindi|spanish|french|german|japanese|chinese|korean|arabic)"
    priority: 6
---

# Translate Skill

Translate text between 100+ languages using the LLM's built-in multilingual capabilities.
No external API required — uses the current model for translation.

## Supported Languages
All major languages including: English, Tamil, Hindi, Spanish, French, German, Japanese, Chinese, Korean, Arabic, Portuguese, Russian, and 90+ more.

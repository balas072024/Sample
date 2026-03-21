---
name: summarize
version: "1.0.0"
description: Summarize text, documents, web pages, and conversations.
author: ArivuClaw
tags:
  - summarize
  - text
  - tldr
  - digest
permissions:
  - memory.read
  - network.http
tools:
  - name: summarize_text
    description: Summarize a given text
    permissions:
      - memory.read
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: Text to summarize
        style:
          type: string
          enum: [brief, detailed, bullets, executive]
          description: Summary style
        maxLength:
          type: number
          description: Maximum summary length in words
      required:
        - text
  - name: summarize_url
    description: Fetch a URL and summarize its content
    permissions:
      - network.http
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: URL to fetch and summarize
        style:
          type: string
          enum: [brief, detailed, bullets, executive]
      required:
        - url
triggers:
  - type: keyword
    pattern: summarize
    priority: 8
  - type: keyword
    pattern: tldr
    priority: 9
  - type: keyword
    pattern: summary
    priority: 7
  - type: keyword
    pattern: digest
    priority: 6
---

# Summarize Skill

Generate concise summaries of text, documents, and web pages.

## Summary Styles
- **brief**: 1-2 sentence summary
- **detailed**: Comprehensive paragraph summary
- **bullets**: Key points as bullet list
- **executive**: Executive briefing format with key insights and recommendations

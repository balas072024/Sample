---
name: context-manager
version: 1.0.0
description: Manages conversation context, memory optimization, and session state for long-running interactions.
author: ArivuClaw
tags:
  - system
  - context
  - memory
  - session
permissions:
  - read_files
  - write_files
tools:
  - name: save_context
    description: Saves the current conversation context or a named memory to persistent storage.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        key:
          type: string
          description: Unique identifier for this context entry.
        content:
          type: string
          description: The context content to save.
        category:
          type: string
          enum: [conversation, fact, preference, project, custom]
          description: Category for organizing context entries.
          default: conversation
        ttl_hours:
          type: integer
          description: Time-to-live in hours. Entry expires after this duration. 0 for permanent.
          default: 0
      required:
        - key
        - content
  - name: recall_context
    description: Retrieves saved context entries by key, category, or search query.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        key:
          type: string
          description: Exact key to retrieve.
        category:
          type: string
          enum: [conversation, fact, preference, project, custom, all]
          default: all
        query:
          type: string
          description: Fuzzy search query across all context entries.
        limit:
          type: integer
          description: Maximum number of entries to return.
          default: 10
      required: []
  - name: optimize_context
    description: Compresses or summarizes context to reduce token usage while preserving key information.
    permissions:
      - read_files
      - write_files
    inputSchema:
      type: object
      properties:
        strategy:
          type: string
          enum: [summarize, prune_old, compress, deduplicate]
          description: Optimization strategy to apply.
        max_tokens:
          type: integer
          description: Target maximum token count after optimization.
        preserve_keys:
          type: array
          items:
            type: string
          description: Context keys to never prune or compress.
      required:
        - strategy
  - name: clear_context
    description: Clears context entries by key, category, or all.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        key:
          type: string
          description: Specific key to clear.
        category:
          type: string
          description: Clear all entries in a category.
        clear_all:
          type: boolean
          description: Clear all context entries.
          default: false
      required: []
triggers:
  - pattern: "remember that {fact}"
  - pattern: "recall {topic}"
  - pattern: "optimize context"
  - pattern: "clear memory"
  - pattern: "what do you remember about {topic}"
---

# Context Manager

Manages conversation context, memory optimization, and session state for long-running interactions.

## Usage

```
remember that the API key is in .env
recall database setup
optimize context
clear memory
what do you remember about deployment
```

## Features

- Persistent context storage with categories and TTL
- Fuzzy search across saved context entries
- Memory optimization: summarize, prune, compress, deduplicate
- Selective clearing by key, category, or full reset

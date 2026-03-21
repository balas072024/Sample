---
name: context-manager
version: "1.0.0"
description: Manage conversation context and memory by saving, recalling, clearing, and summarizing context windows.
author: Arivumaiyam AI
tags: [context, memory, conversation, history, management]
permissions: [filesystem.read, filesystem.write]
tools:
  - name: context_save
    description: Save a named piece of context or memory for later recall
    permissions: [filesystem.write]
    inputSchema:
      type: object
      properties:
        key: { type: string, description: "Unique identifier for this context entry" }
        content: { type: string, description: "The content to save" }
        tags: { type: array, items: { type: string }, description: "Tags for categorizing the context" }
        ttl: { type: number, description: "Time-to-live in seconds before auto-expiry" }
      required: [key, content]
  - name: context_recall
    description: Retrieve previously saved context by key or search by tags
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        key: { type: string, description: "The key of the context entry to recall" }
        tags: { type: array, items: { type: string }, description: "Filter context entries by tags" }
        limit: { type: number, description: "Maximum number of entries to return" }
      required: []
  - name: context_clear
    description: Clear context entries by key, tags, or clear all
    permissions: [filesystem.write]
    inputSchema:
      type: object
      properties:
        key: { type: string, description: "Specific context key to clear" }
        tags: { type: array, items: { type: string }, description: "Clear all entries matching these tags" }
        clear_all: { type: boolean, description: "Whether to clear all stored context" }
      required: []
  - name: context_summarize
    description: Generate a summary of the current conversation or stored context
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        scope: { type: string, enum: [conversation, stored, all], description: "What to summarize" }
        max_length: { type: number, description: "Maximum length of the summary in tokens" }
        focus: { type: string, description: "Topic or area to focus the summary on" }
      required: [scope]
triggers:
  - type: keyword
    pattern: "context|remember|recall|memory|forget|summarize context"
    priority: 6
---

# Context Manager

You are a context and memory management assistant.

Help the user save important information for later recall, manage their conversation context window, and summarize past interactions. When saving context, suggest meaningful keys and tags. When recalling, present information clearly and indicate when entries were saved. Warn the user before clearing context and confirm destructive operations. When summarizing, focus on the most relevant and actionable information.

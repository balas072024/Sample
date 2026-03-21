---
name: note-taking
version: "1.0.0"
description: Create, search, tag, and manage personal notes and knowledge base.
author: Arivumaiyam AI
tags: [notes, knowledge, wiki, markdown]
permissions: [filesystem.read, filesystem.write, memory.read, memory.write]
tools:
  - name: note_create
    description: Create a new note
    permissions: [filesystem.write, memory.write]
    inputSchema:
      type: object
      properties:
        title: { type: string }
        content: { type: string }
        tags: { type: array, items: { type: string } }
        folder: { type: string }
      required: [title, content]
  - name: note_search
    description: Search notes by content or tags
    permissions: [filesystem.read, memory.read]
    inputSchema:
      type: object
      properties:
        query: { type: string }
        tags: { type: array, items: { type: string } }
      required: [query]
  - name: note_list
    description: List all notes, optionally filtered by folder or tag
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        folder: { type: string }
        tag: { type: string }
  - name: note_edit
    description: Edit an existing note
    permissions: [filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        id: { type: string }
        content: { type: string }
        appendMode: { type: boolean }
      required: [id, content]
  - name: note_delete
    description: Delete a note
    permissions: [filesystem.delete]
    inputSchema:
      type: object
      properties:
        id: { type: string }
      required: [id]
triggers:
  - type: keyword
    pattern: note
    priority: 7
  - type: keyword
    pattern: remember
    priority: 5
  - type: keyword
    pattern: knowledge
    priority: 5
  - type: keyword
    pattern: write down
    priority: 6
---

# Note Taking Skill

Personal knowledge base with markdown notes, tags, and semantic search.
Notes are stored in `~/.arivuclaw/notes/` as markdown files.

---
name: obsidian-notes
version: 1.0.0
description: Integrates with Obsidian vaults for note management, wikilink resolution, graph traversal, and search.
author: ArivuClaw
tags:
  - integration
  - notes
  - obsidian
  - knowledge-management
permissions:
  - read_files
  - write_files
tools:
  - name: search_vault
    description: Searches notes in an Obsidian vault by content, tags, or metadata.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        vault_path:
          type: string
          description: Path to the Obsidian vault root directory.
        query:
          type: string
          description: Search query string.
        search_in:
          type: string
          enum: [content, tags, title, all]
          default: all
        tags:
          type: array
          items:
            type: string
          description: Filter by specific tags.
      required:
        - vault_path
        - query
  - name: create_note
    description: Creates a new note in the vault with optional metadata and wikilinks.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        vault_path:
          type: string
          description: Path to the Obsidian vault.
        title:
          type: string
          description: Note title (used as filename).
        content:
          type: string
          description: Note body in Markdown.
        folder:
          type: string
          description: Subfolder within the vault.
        tags:
          type: array
          items:
            type: string
          description: Tags to add to frontmatter.
        template:
          type: string
          description: Name of a template note to use.
      required:
        - vault_path
        - title
        - content
  - name: resolve_links
    description: Resolves wikilinks and shows the link graph for a note.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        vault_path:
          type: string
          description: Path to the Obsidian vault.
        note:
          type: string
          description: Note title or path to analyze.
        depth:
          type: integer
          description: Link traversal depth for graph view.
          default: 1
      required:
        - vault_path
        - note
triggers:
  - pattern: "search vault for {query}"
  - pattern: "create note {title}"
  - pattern: "show links for {note}"
  - pattern: "find notes tagged {tag}"
---

# Obsidian Notes

Integrates with Obsidian vaults for note management, wikilink resolution, graph traversal, and full-text search.

## Usage

```
search vault for machine learning
create note Daily Standup 2026-03-21
show links for Project Roadmap
find notes tagged #research
```

## Features

- Full-text search across vault content, tags, and titles
- Note creation with frontmatter, tags, and template support
- Wikilink resolution and link graph traversal
- Folder-based organization within vaults

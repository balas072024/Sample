---
name: obsidian-notes
version: "1.0.0"
description: Obsidian vault integration for creating and searching notes, managing wikilinks, backlinks, and graph views.
author: ArivuClaw
tags: [obsidian, notes, markdown, knowledge-base, wikilinks]
permissions: [filesystem.read, filesystem.write]
tools:
  - name: obsidian_create
    description: Create or update a note in the Obsidian vault
    permissions: [filesystem.write]
    inputSchema:
      type: object
      properties:
        title: { type: string, description: "Note title (used as filename)" }
        content: { type: string, description: "Markdown content of the note" }
        folder: { type: string, description: "Subfolder within the vault" }
        tags: { type: array, items: { type: string }, description: "Tags to add to the note frontmatter" }
        template: { type: string, description: "Template name to use for the note" }
        overwrite: { type: boolean, description: "Whether to overwrite if the note exists" }
      required: [title, content]
  - name: obsidian_search
    description: Search notes in the vault by content, title, or tags
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "Search query string" }
        scope: { type: string, enum: [content, title, tags, all], description: "Where to search" }
        folder: { type: string, description: "Limit search to a specific folder" }
        limit: { type: number, description: "Maximum number of results" }
      required: [query]
  - name: obsidian_links
    description: Manage wikilinks and backlinks for a note
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        note: { type: string, description: "Note title to inspect" }
        action: { type: string, enum: [outgoing, incoming, unlinked, suggest], description: "Type of link analysis" }
        include_context: { type: boolean, description: "Whether to include surrounding text context" }
      required: [note, action]
  - name: obsidian_graph
    description: Generate or query the knowledge graph of the vault
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [full, local, clusters, orphans, stats], description: "Graph operation to perform" }
        center_note: { type: string, description: "Note to center the local graph around" }
        depth: { type: number, description: "Depth of connections to include in local graph" }
        filter_tags: { type: array, items: { type: string }, description: "Filter graph nodes by tags" }
      required: [action]
triggers:
  - type: keyword
    pattern: "obsidian|vault|note|wikilink|backlink|knowledge base"
    priority: 7
---

# Obsidian Notes

You are an Obsidian vault management assistant.

Help the user create, search, and organize notes in their Obsidian vault. When creating notes, use proper Markdown formatting with YAML frontmatter for metadata. Suggest wikilinks to existing notes when relevant content is detected. When searching, rank results by relevance and show matching excerpts. For graph operations, describe the structure of connections and identify clusters or orphaned notes. Respect the user's folder structure and naming conventions.

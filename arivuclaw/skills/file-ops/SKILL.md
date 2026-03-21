---
name: file-ops
version: "1.0.0"
description: Read, write, search, and manage files on the local filesystem.
author: Arivumaiyam AI
tags:
  - filesystem
  - files
  - read
  - write
permissions:
  - filesystem.read
  - filesystem.write
tools:
  - name: read_file
    description: Read the contents of a file
    permissions:
      - filesystem.read
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Path to the file
      required:
        - path
  - name: write_file
    description: Write content to a file (creates or overwrites)
    permissions:
      - filesystem.write
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Path to the file
        content:
          type: string
          description: Content to write
      required:
        - path
        - content
  - name: list_directory
    description: List files and directories at a given path
    permissions:
      - filesystem.read
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Directory path
        pattern:
          type: string
          description: Glob pattern to filter (e.g., "*.ts")
      required:
        - path
  - name: search_files
    description: Search file contents using regex patterns
    permissions:
      - filesystem.read
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Directory to search in
        pattern:
          type: string
          description: Regex pattern to search for
        fileGlob:
          type: string
          description: File pattern to search (e.g., "*.ts")
      required:
        - path
        - pattern
triggers:
  - type: keyword
    pattern: file
    priority: 3
  - type: keyword
    pattern: read
    priority: 2
  - type: keyword
    pattern: write
    priority: 2
  - type: keyword
    pattern: directory
    priority: 3
---

# File Operations Skill

Manage files and directories on the local filesystem.

## Security
- All paths are validated against the security policy
- Path traversal attempts are blocked
- Sensitive paths (/etc/shadow, .ssh, .env) are blocked by default
- Write operations require explicit filesystem.write permission

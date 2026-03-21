---
name: code-exec
version: "1.0.0"
description: Execute code and shell commands in a sandboxed environment.
author: Arivumaiyam AI
tags:
  - code
  - execute
  - bash
  - shell
permissions:
  - code.execute
  - system.process
tools:
  - name: bash
    description: Execute a bash command and return the output
    permissions:
      - code.execute
      - system.process
    inputSchema:
      type: object
      properties:
        command:
          type: string
          description: The bash command to execute
        workDir:
          type: string
          description: Working directory (defaults to session workdir)
        timeout:
          type: number
          description: "Timeout in milliseconds (default: 15000)"
      required:
        - command
  - name: run_script
    description: Execute a script file (Python, Node.js, etc.)
    permissions:
      - code.execute
      - system.process
      - filesystem.read
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the script file
        args:
          type: array
          description: Command-line arguments
        runtime:
          type: string
          enum: [auto, python, node, bash]
          description: Runtime to use (auto-detected by default)
      required:
        - file
triggers:
  - type: keyword
    pattern: run
    priority: 5
  - type: keyword
    pattern: execute
    priority: 5
  - type: keyword
    pattern: command
    priority: 4
  - type: regex
    pattern: "^\\$"
    priority: 8
---

# Code Execution Skill

Execute shell commands and scripts in a controlled environment.

## Security
- Commands execute in a sandbox with timeout limits
- Destructive commands (rm -rf /, fork bombs, etc.) are blocked
- Output is capped at 1MB to prevent memory issues
- Each command has a 15-second default timeout

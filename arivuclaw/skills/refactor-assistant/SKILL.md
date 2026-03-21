---
name: refactor-assistant
version: 1.0.0
description: Recommends and applies code improvements including modernization, pattern upgrades, and structural refactoring.
author: ArivuClaw
tags:
  - development
  - refactoring
  - modernization
  - code-quality
permissions:
  - read_files
  - write_files
tools:
  - name: analyze_refactor
    description: Scans code and identifies refactoring opportunities with explanations.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the file to analyze.
        scope:
          type: string
          enum: [function, file, module]
          description: Scope of the refactoring analysis.
          default: file
        focus:
          type: array
          items:
            type: string
            enum: [simplify, modernize, extract, rename, dry, solid]
          description: Refactoring strategies to prioritize.
      required:
        - file_path
  - name: apply_refactor
    description: Applies a specific refactoring transformation to the code.
    permissions:
      - read_files
      - write_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the file to refactor.
        refactor_type:
          type: string
          enum: [extract_function, inline, rename, simplify_conditional, convert_to_async, apply_pattern]
          description: The type of refactoring to apply.
        target:
          type: string
          description: The code element to refactor (function name, line range, etc.).
        preview:
          type: boolean
          description: Show a diff preview before applying.
          default: true
      required:
        - file_path
        - refactor_type
        - target
triggers:
  - pattern: "refactor {file}"
  - pattern: "improve code in {file}"
  - pattern: "modernize {file}"
  - pattern: "simplify {function}"
---

# Refactor Assistant

Recommends and applies code improvements including modernization, design pattern upgrades, and structural refactoring with diff previews.

## Usage

```
refactor src/legacy.js
improve code in handlers/auth.py
modernize lib/utils.rb
simplify processOrder
```

## Features

- Refactoring opportunity detection with explanations
- Extract function, inline, rename, simplify transformations
- Modernization suggestions (async/await, modern APIs)
- SOLID and DRY principle enforcement
- Diff preview before applying changes

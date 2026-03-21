---
name: code-review
version: 1.0.0
description: Analyzes code for quality, bugs, style violations, and security issues. Supports multiple languages and configurable rulesets.
author: Arivumaiyam AI
tags:
  - development
  - code-quality
  - security
  - linting
permissions:
  - read_files
  - write_files
tools:
  - name: analyze_code
    description: Performs a comprehensive code review on the provided source file or snippet.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Absolute path to the file to review.
        language:
          type: string
          description: Programming language (auto-detected if omitted).
        ruleset:
          type: string
          enum: [default, strict, minimal]
          description: Severity level for the review rules.
          default: default
        focus:
          type: array
          items:
            type: string
            enum: [bugs, style, security, performance, readability]
          description: Areas to focus the review on.
      required:
        - file_path
  - name: suggest_fixes
    description: Returns actionable fix suggestions for issues found during review.
    permissions:
      - read_files
      - write_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the file containing issues.
        issues:
          type: array
          items:
            type: object
            properties:
              line:
                type: integer
              severity:
                type: string
              message:
                type: string
          description: List of issues to generate fixes for.
        auto_apply:
          type: boolean
          description: Whether to apply fixes automatically.
          default: false
      required:
        - file_path
        - issues
triggers:
  - pattern: "review {file}"
  - pattern: "check code quality"
  - pattern: "find bugs in {file}"
  - pattern: "security scan {file}"
---

# Code Review

Analyzes source code for quality issues, potential bugs, style violations, and security vulnerabilities. Supports configurable rulesets and multiple programming languages.

## Usage

```
review src/main.py
check code quality
find bugs in lib/auth.js
security scan server/handler.go
```

## Features

- Multi-language support with auto-detection
- Configurable severity rulesets (default, strict, minimal)
- Focused reviews: bugs, style, security, performance, readability
- Actionable fix suggestions with optional auto-apply

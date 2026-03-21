---
name: debug-assistant
version: 1.0.0
description: Helps identify and resolve coding errors by analyzing stack traces, logs, and runtime behavior. Supports interactive debug sessions.
author: Arivumaiyam AI
tags:
  - development
  - debugging
  - error-analysis
  - stack-trace
permissions:
  - read_files
  - execute_commands
tools:
  - name: analyze_error
    description: Parses and explains an error message or stack trace with root cause analysis.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        error_text:
          type: string
          description: The error message or stack trace to analyze.
        file_path:
          type: string
          description: Path to the file where the error originated.
        language:
          type: string
          description: Programming language context.
      required:
        - error_text
  - name: debug_session
    description: Starts an interactive debug session to walk through code execution step by step.
    permissions:
      - read_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the file to debug.
        breakpoints:
          type: array
          items:
            type: integer
          description: Line numbers to set breakpoints on.
        watch_vars:
          type: array
          items:
            type: string
          description: Variable names to watch during execution.
      required:
        - file_path
  - name: suggest_debug_steps
    description: Recommends a sequence of debugging steps based on the error context.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        error_text:
          type: string
          description: The error or symptom description.
        context:
          type: string
          description: Additional context about the environment or reproduction steps.
      required:
        - error_text
triggers:
  - pattern: "debug {error}"
  - pattern: "explain this error"
  - pattern: "fix stack trace"
  - pattern: "why is this failing"
---

# Debug Assistant

Helps identify and resolve coding errors by analyzing stack traces, log output, and runtime behavior. Offers root cause analysis and guided debugging sessions.

## Usage

```
debug TypeError: cannot read property 'id' of undefined
explain this error
fix stack trace
why is this failing
```

## Features

- Stack trace parsing with root cause analysis
- Interactive step-by-step debug sessions
- Breakpoint and variable watch support
- Context-aware debugging recommendations

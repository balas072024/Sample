---
name: error-tracker
version: 1.0.0
description: Tracks and analyzes application errors and logs. Detects patterns, groups similar errors, and provides resolution suggestions.
author: ArivuClaw
tags:
  - devops
  - monitoring
  - errors
  - logging
permissions:
  - read_files
  - write_files
  - network_access
tools:
  - name: parse_logs
    description: Parses log files and extracts error entries with structured metadata.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the log file.
        log_format:
          type: string
          enum: [auto, json, syslog, apache, nginx, custom]
          default: auto
        severity_filter:
          type: string
          enum: [all, error, warning, critical]
          default: error
        time_range:
          type: object
          properties:
            from:
              type: string
              format: date-time
            to:
              type: string
              format: date-time
          description: Time range to filter logs.
      required:
        - file_path
  - name: group_errors
    description: Groups similar errors by stack trace or message pattern.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        errors:
          type: array
          items:
            type: object
          description: List of error objects to group.
        group_by:
          type: string
          enum: [message, stack_trace, error_code, file]
          default: message
      required:
        - errors
  - name: suggest_resolution
    description: Provides resolution suggestions for a specific error pattern.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        error_message:
          type: string
          description: The error message to resolve.
        stack_trace:
          type: string
          description: Associated stack trace.
        context:
          type: string
          description: Application context or environment details.
      required:
        - error_message
triggers:
  - pattern: "parse errors in {file}"
  - pattern: "analyze logs"
  - pattern: "group similar errors"
  - pattern: "how to fix {error}"
---

# Error Tracker

Tracks and analyzes application errors and logs. Detects patterns, groups similar errors, and provides resolution suggestions.

## Usage

```
parse errors in /var/log/app.log
analyze logs
group similar errors
how to fix ConnectionRefusedError
```

## Features

- Multi-format log parsing: JSON, syslog, Apache, Nginx, custom
- Severity filtering and time range selection
- Error grouping by message, stack trace, error code, or file
- AI-powered resolution suggestions

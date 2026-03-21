---
name: heartbeat-monitor
version: 1.0.0
description: Runs background health checks, recurring tasks, and heartbeat monitoring for services and processes.
author: ArivuClaw
tags:
  - system
  - monitoring
  - health-check
  - scheduler
permissions:
  - network_access
  - execute_commands
  - read_files
  - write_files
tools:
  - name: register_heartbeat
    description: Registers a recurring health check for a service or endpoint.
    permissions:
      - network_access
      - write_files
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: Name identifier for this heartbeat check.
        target:
          type: string
          description: URL endpoint or command to check.
        type:
          type: string
          enum: [http, tcp, command, process]
          description: Type of health check.
          default: http
        interval_seconds:
          type: integer
          description: Check interval in seconds.
          default: 60
        timeout_ms:
          type: integer
          description: Timeout per check in milliseconds.
          default: 5000
        alert_after:
          type: integer
          description: Number of consecutive failures before alerting.
          default: 3
      required:
        - name
        - target
  - name: list_heartbeats
    description: Lists all registered heartbeat checks and their current status.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        status_filter:
          type: string
          enum: [all, healthy, unhealthy, unknown]
          default: all
      required: []
  - name: schedule_task
    description: Schedules a recurring background task.
    permissions:
      - execute_commands
      - write_files
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: Task name.
        command:
          type: string
          description: Command or script to execute.
        cron:
          type: string
          description: Cron expression for scheduling (e.g., "*/5 * * * *").
        enabled:
          type: boolean
          default: true
      required:
        - name
        - command
        - cron
  - name: get_health_report
    description: Generates a health report across all monitored services.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        time_range:
          type: string
          enum: [1h, 6h, 24h, 7d]
          default: 24h
        include_history:
          type: boolean
          description: Include check history in the report.
          default: false
      required: []
triggers:
  - pattern: "monitor {service}"
  - pattern: "check health of {service}"
  - pattern: "schedule task {name}"
  - pattern: "show health report"
  - pattern: "list heartbeats"
---

# Heartbeat Monitor

Runs background health checks, recurring tasks, and heartbeat monitoring for services and processes.

## Usage

```
monitor auth-service
check health of database
schedule task cleanup-logs
show health report
list heartbeats
```

## Features

- Multi-type health checks: HTTP, TCP, command, process
- Configurable intervals and failure thresholds
- Cron-based recurring task scheduling
- Health reports with uptime history

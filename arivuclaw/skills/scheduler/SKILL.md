---
name: scheduler
version: "1.0.0"
description: Schedule tasks, reminders, and recurring jobs.
author: ArivuClaw
tags:
  - schedule
  - reminder
  - cron
  - timer
permissions:
  - schedule.create
  - schedule.delete
  - channel.send
tools:
  - name: create_reminder
    description: Set a one-time reminder
    permissions:
      - schedule.create
      - channel.send
    inputSchema:
      type: object
      properties:
        message:
          type: string
          description: Reminder message
        when:
          type: string
          description: When to remind (ISO 8601 or natural language like "in 30 minutes")
        channel:
          type: string
          description: Channel to send reminder on (defaults to current)
      required:
        - message
        - when
  - name: create_recurring
    description: Create a recurring scheduled job
    permissions:
      - schedule.create
      - channel.send
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: Job name
        message:
          type: string
          description: Message or action to perform
        cron:
          type: string
          description: Cron expression (e.g., "0 9 * * MON-FRI" for weekday mornings)
      required:
        - name
        - message
        - cron
  - name: list_schedules
    description: List all active schedules and reminders
    permissions:
      - schedule.create
    inputSchema:
      type: object
      properties: {}
  - name: cancel_schedule
    description: Cancel a scheduled job by ID
    permissions:
      - schedule.delete
    inputSchema:
      type: object
      properties:
        id:
          type: string
          description: Schedule ID to cancel
      required:
        - id
triggers:
  - type: keyword
    pattern: remind
    priority: 8
  - type: keyword
    pattern: schedule
    priority: 7
  - type: keyword
    pattern: alarm
    priority: 6
  - type: regex
    pattern: "in \\d+ (minutes?|hours?|days?)"
    priority: 6
---

# Scheduler Skill

Set reminders and schedule recurring tasks.

## Supported Time Formats
- ISO 8601: "2026-03-21T15:00:00Z"
- Relative: "in 30 minutes", "in 2 hours", "tomorrow at 9am"
- Cron: "0 9 * * MON-FRI" (weekday mornings at 9)

## Examples
- "Remind me to check email in 30 minutes"
- "Schedule a daily standup reminder at 9am"
- "Set an alarm for tomorrow at 7:30am"

---
name: date-time
version: "1.0.0"
description: Date/time operations – current time, timezone conversion, date math, countdowns, formatting
author: ArivuClaw
tags: [date, time, timezone, calendar, conversion]
permissions: [system.clock]
tools:
  - name: current_time
    description: Get the current date and time in a specified timezone
    permissions: [system.clock]
    inputSchema:
      type: object
      properties:
        timezone: { type: string, description: "IANA timezone identifier (e.g. America/New_York)" }
        format: { type: string, description: "Output format string (e.g. YYYY-MM-DD HH:mm:ss)" }
      required: []
  - name: convert_timezone
    description: Convert a date/time value from one timezone to another
    permissions: [system.clock]
    inputSchema:
      type: object
      properties:
        datetime: { type: string, description: "The date/time string to convert" }
        from_tz: { type: string, description: "Source IANA timezone" }
        to_tz: { type: string, description: "Target IANA timezone" }
        format: { type: string, description: "Output format string" }
      required: [datetime, from_tz, to_tz]
  - name: date_diff
    description: Calculate the difference between two dates
    permissions: [system.clock]
    inputSchema:
      type: object
      properties:
        start: { type: string, description: "Start date/time string" }
        end: { type: string, description: "End date/time string" }
        unit: { type: string, enum: [seconds, minutes, hours, days, weeks, months, years], description: "Unit for the result" }
      required: [start, end]
  - name: date_format
    description: Parse and reformat a date/time string
    permissions: [system.clock]
    inputSchema:
      type: object
      properties:
        datetime: { type: string, description: "The date/time string to format" }
        input_format: { type: string, description: "Format of the input string" }
        output_format: { type: string, description: "Desired output format" }
        locale: { type: string, description: "Locale for formatting (e.g. en-US, ja-JP)" }
      required: [datetime, output_format]
  - name: countdown
    description: Calculate time remaining until a target date
    permissions: [system.clock]
    inputSchema:
      type: object
      properties:
        target: { type: string, description: "Target date/time string" }
        timezone: { type: string, description: "Timezone for the target date" }
        include_time: { type: boolean, description: "Include hours/minutes/seconds in the countdown" }
      required: [target]
triggers:
  - type: keyword
    pattern: "time|date|timezone|countdown|calendar"
    priority: 5
---

# Date & Time

You are a date and time utility assistant.

When the user asks about the current time, use `current_time` with their timezone if known, otherwise default to UTC. For timezone conversions, use `convert_timezone` and clearly show both the source and target times.

Use `date_diff` to answer questions like "how many days between X and Y" or "how long ago was X". Always clarify the unit of measurement.

Use `countdown` for questions like "how long until Christmas" or "days remaining until a deadline". Present the result in a human-friendly format.

Use `date_format` when the user needs a date in a specific format or locale. Support common formats like ISO 8601, RFC 2822, and Unix timestamps.

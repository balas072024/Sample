---
name: date-time
version: "1.0.0"
description: Date and time operations including current time, timezone conversion, date math, countdowns, and formatting.
author: ArivuClaw
tags: [date, time, timezone, calendar, countdown]
permissions: [network.fetch]
tools:
  - name: current_time
    description: Get the current date and time in a specified timezone
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        timezone: { type: string, description: "IANA timezone identifier (e.g. America/New_York)" }
        format: { type: string, description: "Output format string (e.g. YYYY-MM-DD HH:mm:ss)" }
      required: []
  - name: convert_timezone
    description: Convert a date/time value from one timezone to another
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        datetime: { type: string, description: "The date/time string to convert" }
        from_tz: { type: string, description: "Source IANA timezone identifier" }
        to_tz: { type: string, description: "Target IANA timezone identifier" }
        format: { type: string, description: "Output format string" }
      required: [datetime, from_tz, to_tz]
  - name: date_diff
    description: Calculate the difference between two dates in various units
    permissions: []
    inputSchema:
      type: object
      properties:
        start: { type: string, description: "Start date/time string" }
        end: { type: string, description: "End date/time string" }
        unit: { type: string, enum: [seconds, minutes, hours, days, weeks, months, years], description: "Unit for the difference" }
      required: [start, end]
  - name: date_format
    description: Parse and reformat a date/time string
    permissions: []
    inputSchema:
      type: object
      properties:
        datetime: { type: string, description: "The date/time string to format" }
        input_format: { type: string, description: "Format of the input string" }
        output_format: { type: string, description: "Desired output format string" }
        locale: { type: string, description: "Locale for formatting (e.g. en-US, fr-FR)" }
      required: [datetime, output_format]
  - name: countdown
    description: Calculate time remaining until a target date/time
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        target: { type: string, description: "Target date/time string" }
        timezone: { type: string, description: "Timezone for the target date/time" }
        granularity: { type: string, enum: [seconds, minutes, hours, days], description: "Smallest unit to include in the countdown" }
      required: [target]
triggers:
  - type: keyword
    pattern: "time|date|timezone|countdown|calendar|schedule"
    priority: 5
---

# Date Time

You are a date and time utility assistant.

Help the user with all date and time operations. When returning times, always clarify the timezone. For timezone conversions, show both the source and target clearly. When calculating differences, present results in the most human-readable unit unless a specific unit is requested. For countdowns, present the remaining time in a friendly format. Always handle ambiguous date formats by asking the user to clarify if needed.

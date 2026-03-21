---
name: meeting-summary
version: 1.0.0
description: Summarizes meetings and extracts action items, decisions, and key topics from transcripts or notes.
author: ArivuClaw
tags:
  - productivity
  - meetings
  - summarization
  - action-items
permissions:
  - read_files
  - write_files
tools:
  - name: summarize_meeting
    description: Generates a structured summary from a meeting transcript or notes.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        transcript:
          type: string
          description: Raw meeting transcript text.
        file_path:
          type: string
          description: Path to a transcript file (used if transcript is not provided).
        format:
          type: string
          enum: [brief, detailed, bullet_points]
          description: Output format for the summary.
          default: detailed
      required: []
  - name: extract_action_items
    description: Extracts action items with assignees and due dates from meeting content.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        transcript:
          type: string
          description: Meeting transcript text.
        file_path:
          type: string
          description: Path to a transcript file.
        participants:
          type: array
          items:
            type: string
          description: List of participant names for assignee matching.
      required: []
  - name: export_summary
    description: Exports the meeting summary to a file in the specified format.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        summary:
          type: object
          description: The summary object to export.
        output_path:
          type: string
          description: Path to write the summary file.
        format:
          type: string
          enum: [markdown, json, text]
          default: markdown
      required:
        - summary
        - output_path
triggers:
  - pattern: "summarize meeting"
  - pattern: "extract action items from {file}"
  - pattern: "meeting notes for {file}"
  - pattern: "what were the decisions"
---

# Meeting Summary

Summarizes meetings and extracts action items, decisions, and key discussion topics from transcripts or notes.

## Usage

```
summarize meeting
extract action items from transcript.txt
meeting notes for standup.md
what were the decisions
```

## Features

- Structured summaries in brief, detailed, or bullet point formats
- Action item extraction with assignees and due dates
- Participant-aware assignee matching
- Export to Markdown, JSON, or plain text

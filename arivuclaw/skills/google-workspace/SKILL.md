---
name: google-workspace
version: "1.0.0"
description: Google Workspace integration for Gmail, Calendar, Drive, Docs, and Sheets operations.
author: Arivumaiyam AI
tags: [google, gmail, calendar, drive, docs, sheets]
permissions: [network.fetch, filesystem.read, filesystem.write]
tools:
  - name: gmail_send
    description: Compose and send an email via Gmail
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        to: { type: array, items: { type: string }, description: "Recipient email addresses" }
        subject: { type: string, description: "Email subject line" }
        body: { type: string, description: "Email body content" }
        cc: { type: array, items: { type: string }, description: "CC recipients" }
        attachments: { type: array, items: { type: string }, description: "File paths to attach" }
      required: [to, subject, body]
  - name: gmail_search
    description: Search Gmail messages using query syntax
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "Gmail search query (supports Gmail search operators)" }
        max_results: { type: number, description: "Maximum number of results to return" }
        include_body: { type: boolean, description: "Whether to include full message body" }
      required: [query]
  - name: calendar_events
    description: List, create, update, or delete Google Calendar events
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, update, delete], description: "Calendar action to perform" }
        calendar_id: { type: string, description: "Calendar ID (default: primary)" }
        event_id: { type: string, description: "Event ID for update/delete operations" }
        title: { type: string, description: "Event title" }
        start: { type: string, description: "Event start date/time in ISO 8601 format" }
        end: { type: string, description: "Event end date/time in ISO 8601 format" }
        attendees: { type: array, items: { type: string }, description: "Attendee email addresses" }
      required: [action]
  - name: drive_list
    description: List, search, upload, or download files in Google Drive
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, search, upload, download], description: "Drive action to perform" }
        query: { type: string, description: "Search query for Drive files" }
        folder_id: { type: string, description: "Folder ID to list or upload into" }
        file_path: { type: string, description: "Local file path for upload/download" }
        file_id: { type: string, description: "Drive file ID for download" }
      required: [action]
  - name: sheets_read
    description: Read from or write to Google Sheets
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [read, write, append, clear], description: "Sheets action to perform" }
        spreadsheet_id: { type: string, description: "Google Sheets spreadsheet ID" }
        range: { type: string, description: "Cell range in A1 notation (e.g. Sheet1!A1:D10)" }
        values: { type: array, items: { type: array, items: { type: string } }, description: "2D array of values to write" }
      required: [action, spreadsheet_id]
triggers:
  - type: keyword
    pattern: "gmail|email|calendar|drive|docs|sheets|google workspace"
    priority: 7
---

# Google Workspace

You are a Google Workspace integration assistant.

Help the user interact with Gmail, Google Calendar, Google Drive, Google Docs, and Google Sheets. When sending emails, confirm recipients and content before sending. For calendar operations, always display times with timezone information. When working with Drive, show file metadata including sharing permissions. For Sheets, present data in a readable tabular format. Always handle authentication errors gracefully and guide the user through re-authentication if needed.

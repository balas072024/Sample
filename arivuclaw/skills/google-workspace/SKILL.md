---
name: google-workspace
version: "1.0.0"
description: Google Workspace integration – Gmail, Calendar, Drive, Docs, Sheets
author: ArivuClaw
tags: [google, gmail, calendar, drive, sheets]
permissions: [network.outbound, google.api]
tools:
  - name: gmail_send
    description: Compose and send an email via Gmail
    permissions: [google.api]
    inputSchema:
      type: object
      properties:
        to: { type: string, description: "Recipient email address" }
        subject: { type: string, description: "Email subject line" }
        body: { type: string, description: "Email body content" }
        cc: { type: string, description: "CC recipients (comma-separated)" }
        bcc: { type: string, description: "BCC recipients (comma-separated)" }
        html: { type: boolean, description: "Whether the body is HTML" }
      required: [to, subject, body]
  - name: gmail_search
    description: Search Gmail messages using query filters
    permissions: [google.api]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "Gmail search query (supports Gmail search syntax)" }
        max_results: { type: number, description: "Maximum number of messages to return" }
        include_body: { type: boolean, description: "Whether to include message bodies" }
      required: [query]
  - name: calendar_events
    description: List, create, or manage Google Calendar events
    permissions: [google.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, update, delete], description: "Action to perform" }
        calendar_id: { type: string, description: "Calendar ID (default: primary)" }
        title: { type: string, description: "Event title" }
        start: { type: string, description: "Event start time (ISO 8601)" }
        end: { type: string, description: "Event end time (ISO 8601)" }
        attendees: { type: array, items: { type: string }, description: "Attendee email addresses" }
        event_id: { type: string, description: "Event ID for update/delete" }
      required: [action]
  - name: drive_list
    description: List, search, and manage files in Google Drive
    permissions: [google.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, search, info, share, download], description: "Action to perform" }
        query: { type: string, description: "Search query for files" }
        folder_id: { type: string, description: "Folder ID to list contents of" }
        file_id: { type: string, description: "File ID for info/share/download" }
        limit: { type: number, description: "Maximum number of results" }
      required: [action]
  - name: sheets_read
    description: Read and write data in Google Sheets
    permissions: [google.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [read, write, append, clear], description: "Action to perform" }
        spreadsheet_id: { type: string, description: "Google Sheets spreadsheet ID" }
        range: { type: string, description: "Cell range in A1 notation (e.g. Sheet1!A1:C10)" }
        values: { type: array, items: { type: array, items: { type: string } }, description: "Data to write (2D array)" }
      required: [action, spreadsheet_id]
triggers:
  - type: keyword
    pattern: "gmail|google|calendar|drive|sheets|spreadsheet|email"
    priority: 7
---

# Google Workspace

You are a Google Workspace integration assistant with access to Gmail, Calendar, Drive, Docs, and Sheets.

For email operations, use `gmail_send` to compose messages and `gmail_search` to find emails. Support Gmail search operators like `from:`, `to:`, `subject:`, `has:attachment`.

For calendar operations, use `calendar_events` to list upcoming events, create new ones, or manage existing ones. Always confirm event details before creating. Display times in the user's local timezone.

For file management, use `drive_list` to browse and search Google Drive. Help users find files, share them, and organize folders.

For spreadsheet operations, use `sheets_read` to read cell ranges and write data. Format output as tables when displaying sheet data. Support common operations like appending rows and clearing ranges.

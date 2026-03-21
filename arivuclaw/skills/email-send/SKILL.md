---
name: email-send
version: "1.0.0"
description: Send emails via SMTP, Gmail, or Outlook. Read inbox. Manage drafts.
author: Arivumaiyam AI
tags:
  - email
  - smtp
  - gmail
  - outlook
  - inbox
permissions:
  - email.send
  - network.http
tools:
  - name: send_email
    description: Send an email to one or more recipients
    permissions:
      - email.send
    inputSchema:
      type: object
      properties:
        to:
          type: array
          items: { type: string }
          description: Recipient email addresses
        subject:
          type: string
        body:
          type: string
          description: Email body (supports HTML)
        cc:
          type: array
          items: { type: string }
        attachments:
          type: array
          items:
            type: object
            properties:
              filename: { type: string }
              path: { type: string }
      required: [to, subject, body]
  - name: read_inbox
    description: Read recent emails from inbox
    permissions:
      - email.send
    inputSchema:
      type: object
      properties:
        limit:
          type: number
          description: Number of emails to fetch (default 10)
        unreadOnly:
          type: boolean
  - name: search_emails
    description: Search emails by query
    permissions:
      - email.send
    inputSchema:
      type: object
      properties:
        query:
          type: string
        limit:
          type: number
      required: [query]
triggers:
  - type: keyword
    pattern: email
    priority: 8
  - type: keyword
    pattern: mail
    priority: 6
  - type: keyword
    pattern: send
    priority: 3
  - type: regex
    pattern: "@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    priority: 5
---

# Email Skill

Send and read emails directly from Arivumaiyam AI.

## Setup
Configure your email provider in `arivuclaw.config.json`:
```json
{
  "skills": {
    "email": {
      "provider": "gmail",
      "credentials": {
        "user": "you@gmail.com",
        "appPassword": "your-app-password"
      }
    }
  }
}
```

Supported providers: Gmail, Outlook, Yahoo, custom SMTP.

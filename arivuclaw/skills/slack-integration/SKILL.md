---
name: slack-integration
version: 1.0.0
description: Full Slack integration for channels, messages, threads, reactions, and file sharing.
author: ArivuClaw
tags:
  - integration
  - slack
  - messaging
  - communication
permissions:
  - network_access
  - read_files
tools:
  - name: send_message
    description: Sends a message to a Slack channel or user.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        channel:
          type: string
          description: Channel name or ID (e.g., "#general", "@alice").
        text:
          type: string
          description: Message text (supports Slack markdown).
        thread_ts:
          type: string
          description: Thread timestamp to reply in a thread.
        blocks:
          type: array
          items:
            type: object
          description: Slack Block Kit blocks for rich messages.
      required:
        - channel
        - text
  - name: read_messages
    description: Reads recent messages from a channel or thread.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        channel:
          type: string
          description: Channel name or ID.
        thread_ts:
          type: string
          description: Thread timestamp to read a specific thread.
        limit:
          type: integer
          description: Number of messages to retrieve.
          default: 20
        since:
          type: string
          format: date-time
          description: Only return messages after this timestamp.
      required:
        - channel
  - name: manage_channels
    description: Lists, creates, archives, or gets info about Slack channels.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum: [list, create, archive, info, invite, set_topic]
        channel:
          type: string
          description: Channel name or ID.
        name:
          type: string
          description: Channel name (for create).
        topic:
          type: string
          description: Channel topic (for set_topic).
        users:
          type: array
          items:
            type: string
          description: Users to invite (for invite).
      required:
        - action
  - name: upload_file
    description: Uploads a file to a Slack channel.
    permissions:
      - network_access
      - read_files
    inputSchema:
      type: object
      properties:
        channel:
          type: string
          description: Channel to upload to.
        file_path:
          type: string
          description: Local path to the file.
        title:
          type: string
          description: File title in Slack.
        comment:
          type: string
          description: Initial comment with the file.
      required:
        - channel
        - file_path
triggers:
  - pattern: "send slack message to {channel}"
  - pattern: "read messages in {channel}"
  - pattern: "create slack channel {name}"
  - pattern: "upload {file} to slack {channel}"
  - pattern: "check slack threads"
---

# Slack Integration

Full Slack integration for channels, messages, threads, reactions, and file sharing.

## Usage

```
send slack message to #dev-team
read messages in #general
create slack channel project-alpha
upload report.pdf to slack #reports
check slack threads
```

## Features

- Send messages with Slack markdown and Block Kit support
- Read channel and thread messages with filtering
- Channel management: create, archive, invite, set topic
- File uploads with comments

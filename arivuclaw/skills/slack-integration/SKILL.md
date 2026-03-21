---
name: slack-integration
version: "1.0.0"
description: Full Slack integration for managing channels, messages, threads, reactions, and file sharing.
author: Arivumaiyam AI
tags: [slack, messaging, channels, collaboration, chat]
permissions: [network.fetch, filesystem.read]
tools:
  - name: slack_send
    description: Send a message to a Slack channel or user
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        channel: { type: string, description: "Channel name or ID to send to" }
        message: { type: string, description: "Message text (supports Slack markdown)" }
        thread_ts: { type: string, description: "Thread timestamp to reply in a thread" }
        unfurl_links: { type: boolean, description: "Whether to unfurl URLs in the message" }
      required: [channel, message]
  - name: slack_search
    description: Search Slack messages and files
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "Search query string" }
        scope: { type: string, enum: [messages, files, all], description: "What to search" }
        channel: { type: string, description: "Limit search to a specific channel" }
        from_user: { type: string, description: "Filter by sender username" }
        max_results: { type: number, description: "Maximum number of results" }
      required: [query]
  - name: slack_thread
    description: View or manage a Slack thread
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        channel: { type: string, description: "Channel containing the thread" }
        thread_ts: { type: string, description: "Timestamp of the parent message" }
        action: { type: string, enum: [view, reply, summarize], description: "Thread action to perform" }
        message: { type: string, description: "Reply message text" }
      required: [channel, thread_ts, action]
  - name: slack_channels
    description: List, create, or manage Slack channels
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, archive, info, members, join, leave], description: "Channel action to perform" }
        channel: { type: string, description: "Channel name or ID" }
        purpose: { type: string, description: "Channel purpose/description for create action" }
        is_private: { type: boolean, description: "Whether to create a private channel" }
      required: [action]
  - name: slack_upload
    description: Upload a file to a Slack channel
    permissions: [network.fetch, filesystem.read]
    inputSchema:
      type: object
      properties:
        file_path: { type: string, description: "Local path to the file to upload" }
        channel: { type: string, description: "Channel to share the file in" }
        title: { type: string, description: "Title for the uploaded file" }
        comment: { type: string, description: "Initial comment to post with the file" }
      required: [file_path, channel]
triggers:
  - type: keyword
    pattern: "slack|channel|message|thread|dm|direct message"
    priority: 7
---

# Slack Integration

You are a Slack integration assistant.

Help the user interact with their Slack workspace. When sending messages, preview the content before sending. For searches, present results with timestamps, authors, and channel context. When managing threads, offer to summarize long conversations. For channel management, show member counts and activity levels. Handle file uploads by confirming the file exists and the target channel is accessible. Always respect channel permissions and user preferences.

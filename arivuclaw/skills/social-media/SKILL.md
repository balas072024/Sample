---
name: social-media
version: "1.0.0"
description: Create, schedule, and manage social media posts across Twitter/X, LinkedIn, Instagram, etc.
author: ArivuClaw
tags: [social, twitter, linkedin, instagram, content]
permissions: [network.http, channel.send]
tools:
  - name: social_post
    description: Create and publish a social media post
    permissions: [network.http, channel.send]
    inputSchema:
      type: object
      properties:
        platform: { type: string, enum: [twitter, linkedin, instagram, facebook, mastodon] }
        content: { type: string }
        media: { type: array, items: { type: string }, description: "Paths to media files" }
        scheduleAt: { type: string, description: "ISO 8601 datetime for scheduled posting" }
      required: [platform, content]
  - name: social_analytics
    description: Get analytics for your social media accounts
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        platform: { type: string }
        timeRange: { type: string, enum: [7d, 30d, 90d] }
      required: [platform]
triggers:
  - type: keyword
    pattern: tweet
    priority: 8
  - type: keyword
    pattern: social media
    priority: 7
  - type: keyword
    pattern: post on
    priority: 5
  - type: keyword
    pattern: linkedin
    priority: 8
---

# Social Media Skill

Create and manage social media content across platforms.
Requires API keys for each platform configured in your settings.

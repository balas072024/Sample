---
name: news-digest
version: "1.0.0"
description: Fetch, summarize, and deliver personalized news digests from RSS feeds and news APIs.
author: ArivuClaw
tags: [news, rss, digest, feed]
permissions: [network.http, memory.write, schedule.create]
tools:
  - name: fetch_news
    description: Fetch latest news on a topic
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        topic: { type: string }
        sources: { type: array, items: { type: string } }
        limit: { type: number }
      required: [topic]
  - name: rss_subscribe
    description: Subscribe to an RSS feed
    permissions: [network.http, memory.write]
    inputSchema:
      type: object
      properties:
        url: { type: string }
        name: { type: string }
      required: [url]
  - name: daily_digest
    description: Generate a personalized daily news digest
    permissions: [network.http, memory.read]
    inputSchema:
      type: object
      properties:
        categories: { type: array, items: { type: string } }
triggers:
  - type: keyword
    pattern: news
    priority: 7
  - type: keyword
    pattern: digest
    priority: 6
  - type: keyword
    pattern: headlines
    priority: 7
---

# News Digest Skill

Stay informed with personalized news. Fetches from free RSS feeds and news APIs.
Uses the LLM to summarize and prioritize articles based on your interests.

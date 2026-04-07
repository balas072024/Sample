---
name: web-browse
version: "1.0.0"
description: Browse the web, fetch pages, and extract information from URLs.
author: ArivuClaw
tags:
  - web
  - browse
  - fetch
  - scrape
permissions:
  - network.http
  - browser.navigate
tools:
  - name: fetch_url
    description: Fetch content from a URL and return the text/HTML content
    permissions:
      - network.http
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: The URL to fetch
        format:
          type: string
          enum: [text, html, markdown]
          description: "Output format (default: markdown)"
      required:
        - url
  - name: search_web
    description: Search the web using a search engine
    permissions:
      - network.http
    inputSchema:
      type: object
      properties:
        query:
          type: string
          description: Search query
        maxResults:
          type: number
          description: "Maximum results to return (default: 5)"
      required:
        - query
triggers:
  - type: keyword
    pattern: search
    priority: 5
  - type: keyword
    pattern: browse
    priority: 5
  - type: keyword
    pattern: website
    priority: 3
  - type: regex
    pattern: "https?://"
    priority: 8
---

# Web Browse Skill

Use this skill to fetch and analyze web content.

## Tools

### fetch_url
Fetches the content of a web page. Supports text, HTML, and markdown output formats.
Use markdown format for best readability in chat.

### search_web
Searches the web for information. Returns titles, URLs, and snippets.

## Usage Guidelines
- Always inform the user before fetching external URLs
- Respect robots.txt directives
- Don't fetch more than 10 pages in a single turn
- Prefer markdown format for readability

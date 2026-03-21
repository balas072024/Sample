---
name: burpsuite-proxy
version: "1.0.0"
description: "Burp Suite web application security testing — proxy, scanner, intruder, repeater."
author: ArivuClaw
tags:
  - burpsuite
  - burp
  - proxy
  - web
  - security
permissions:
  - network.http
  - network.tcp
  - system.process
  - code.execute
tools:
  - name: burp_proxy
    description: Configure and start the Burp proxy.
    inputSchema:
      type: object
      properties:
        port:
          type: number
          description: Proxy listener port.
        interface:
          type: string
          description: Network interface to bind to.
        interceptEnabled:
          type: boolean
          description: Whether to enable request interception.
  - name: burp_scan
    description: Run an active or passive scan.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL to scan.
        scanType:
          type: string
          enum:
            - active
            - passive
            - crawl
          description: Type of scan to perform.
        scope:
          type: array
          items:
            type: string
          description: List of URLs or patterns defining the scan scope.
  - name: burp_intruder
    description: Configure and run an Intruder attack.
    inputSchema:
      type: object
      required:
        - request
      properties:
        request:
          type: string
          description: Raw HTTP request template with insertion points.
        positions:
          type: array
          items:
            type: string
          description: Payload positions within the request.
        payloads:
          type: array
          items:
            type: string
          description: Payload values or wordlist paths.
        attackType:
          type: string
          enum:
            - sniper
            - battering_ram
            - pitchfork
            - cluster_bomb
          description: Intruder attack type.
  - name: burp_repeater
    description: Send and modify individual requests.
    inputSchema:
      type: object
      required:
        - request
        - url
      properties:
        request:
          type: string
          description: Raw HTTP request to send.
        url:
          type: string
          description: Target URL.
        method:
          type: string
          description: HTTP method (GET, POST, PUT, etc.).
  - name: burp_sitemap
    description: Get the site map.
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: Filter site map by URL prefix.
        filterMime:
          type: array
          items:
            type: string
          description: Filter by MIME types.
triggers:
  - type: keyword
    value: burp
    priority: 9
  - type: keyword
    value: web security
    priority: 6
---

# Burp Suite Proxy

This skill provides integration with Burp Suite for comprehensive web application security testing, including proxy interception, automated scanning, intruder attacks, and manual request manipulation.

## Capabilities

- **burp_proxy** — Configure and start the Burp Suite proxy listener for intercepting and inspecting HTTP/HTTPS traffic.
- **burp_scan** — Launch active, passive, or crawl-based scans against target web applications to identify vulnerabilities.
- **burp_intruder** — Set up and execute Intruder attacks using sniper, battering ram, pitchfork, or cluster bomb modes for parameter fuzzing and brute forcing.
- **burp_repeater** — Manually craft, modify, and resend individual HTTP requests for precise testing of specific endpoints.
- **burp_sitemap** — Retrieve and filter the accumulated site map for discovered content and endpoints.

## Instructions

1. Start the proxy with `burp_proxy` and configure your browser or tool to route traffic through it.
2. Use `burp_scan` to perform automated vulnerability discovery on in-scope targets.
3. Use `burp_intruder` for targeted parameter testing and `burp_repeater` for manual request manipulation.
4. Review the site map with `burp_sitemap` to ensure full coverage of the target application.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

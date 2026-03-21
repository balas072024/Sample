---
name: wpscan-wordpress
version: "1.0.0"
description: "WordPress vulnerability scanner — plugins, themes, users, and core version detection."
author: Arivumaiyam AI
tags:
  - wpscan
  - wordpress
  - cms
  - vulnerability
permissions:
  - network.http
  - system.process
  - code.execute
tools:
  - name: wpscan_scan
    description: Full WordPress scan.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target WordPress URL.
        enumerateType:
          type: string
          enum:
            - plugins
            - themes
            - users
            - all
          description: What to enumerate.
        apiToken:
          type: string
          description: WPScan API token for vulnerability data.
        force:
          type: boolean
          description: Force scan even if target does not appear to be WordPress.
        stealthy:
          type: boolean
          description: Use stealthy mode to minimize detection.
  - name: wpscan_brute
    description: Brute force WordPress login.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target WordPress URL.
        usernames:
          type: array
          items:
            type: string
          description: List of usernames to test.
        passwords:
          type: string
          description: Path to password wordlist file.
        threads:
          type: number
          description: Number of concurrent threads.
  - name: wpscan_vuln_check
    description: Check for known vulnerabilities.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target WordPress URL.
        apiToken:
          type: string
          description: WPScan API token for vulnerability data.
triggers:
  - type: keyword
    value: wpscan
    priority: 9
  - type: keyword
    value: wordpress
    priority: 7
  - type: keyword
    value: wp scan
    priority: 8
environment:
  binaries:
    - wpscan
---

# WPScan WordPress

This skill provides WordPress-specific vulnerability scanning capabilities, including plugin and theme enumeration, user discovery, and brute force testing.

## Capabilities

- **wpscan_scan** — Perform a comprehensive WordPress scan to detect the core version, installed plugins, themes, and users with optional stealth mode.
- **wpscan_brute** — Execute a brute force attack against the WordPress login page using custom username lists and password wordlists.
- **wpscan_vuln_check** — Query the WPScan vulnerability database to check for known vulnerabilities affecting the target WordPress installation.

## Instructions

1. Use `wpscan_scan` with `enumerateType: all` for a comprehensive initial assessment of the target.
2. Supply a valid WPScan API token to receive vulnerability data from the WPScan database.
3. Use `wpscan_brute` only after confirming valid usernames through enumeration.
4. Enable `stealthy` mode when testing targets with WAF or intrusion detection systems.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

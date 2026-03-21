---
name: web-shells
version: "1.0.0"
description: "Web shell detection, analysis, and generation for authorized web application testing."
author: Arivumaiyam AI
tags:
  - webshell
  - backdoor
  - web
  - pentest
permissions:
  - network.http
  - filesystem.write
  - code.execute
  - unrestricted
tools:
  - name: webshell_generate
    description: Generate a web shell for testing.
    inputSchema:
      type: object
      required:
        - language
        - outputPath
      properties:
        language:
          type: string
          enum:
            - php
            - asp
            - aspx
            - jsp
            - python
          description: Web shell programming language.
        type:
          type: string
          enum:
            - command
            - upload
            - full
          description: Type of web shell functionality.
        obfuscated:
          type: boolean
          description: Whether to obfuscate the web shell code.
        password:
          type: string
          description: Password to protect the web shell.
        outputPath:
          type: string
          description: Output file path for the generated web shell.
  - name: webshell_detect
    description: Scan a directory for web shells.
    inputSchema:
      type: object
      required:
        - path
      properties:
        path:
          type: string
          description: Directory path to scan for web shells.
        deep:
          type: boolean
          description: Perform a deep scan with additional heuristics.
  - name: webshell_analyze
    description: Analyze a suspected web shell file.
    inputSchema:
      type: object
      required:
        - path
      properties:
        path:
          type: string
          description: Path to the suspected web shell file.
triggers:
  - type: keyword
    value: webshell
    priority: 9
  - type: keyword
    value: web shell
    priority: 8
---

# Web Shells

This skill provides web shell generation, detection, and analysis capabilities for authorized web application security testing.

## Capabilities

- **webshell_generate** — Generate web shells in PHP, ASP, ASPX, JSP, or Python with command execution, file upload, or full functionality, with optional obfuscation and password protection.
- **webshell_detect** — Scan directories for known web shell signatures and suspicious patterns using standard and deep heuristic analysis.
- **webshell_analyze** — Perform detailed analysis of a suspected web shell file to identify its capabilities, obfuscation techniques, and indicators of compromise.

## Instructions

1. Use `webshell_generate` to create test web shells for evaluating detection capabilities and WAF rules.
2. Use `webshell_detect` to scan web server directories for unauthorized web shells during incident response or security audits.
3. Use `webshell_analyze` to reverse-engineer and understand suspected web shell files found during investigations.
4. Always password-protect generated web shells and remove them immediately after testing.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

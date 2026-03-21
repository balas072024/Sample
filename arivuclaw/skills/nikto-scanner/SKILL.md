---
name: nikto-scanner
version: "1.0.0"
description: "Web server scanner detecting dangerous files, outdated versions, and vulnerabilities."
author: ArivuClaw
tags:
  - nikto
  - web
  - scanner
  - vulnerability
permissions:
  - network.http
  - system.process
  - code.execute
tools:
  - name: nikto_scan
    description: "Scan a web server for vulnerabilities"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target URL or host to scan"
        port:
          type: number
          description: "Port number to scan"
        ssl:
          type: boolean
          description: "Force SSL mode"
        tuning:
          type: string
          description: "Scan tuning options (e.g. '1234' for specific test types)"
        plugins:
          type: array
          items:
            type: string
          description: "Specific Nikto plugins to run"
        output:
          type: string
          description: "Output file path"
  - name: nikto_list_plugins
    description: "List available Nikto plugins"
    inputSchema:
      type: object
      properties: {}
triggers:
  - type: keyword
    pattern: "nikto"
    priority: 9
  - type: keyword
    pattern: "web scan"
    priority: 6
environment:
  binaries:
    - nikto
---

# Nikto Scanner

Web server scanner that detects dangerous files, outdated server versions, and known vulnerabilities.

## Usage

Use this skill to scan web servers for security issues including misconfigurations, default files, outdated software, and known vulnerabilities.

### Tools

- **nikto_scan** -- Perform a comprehensive scan of a web server. Configure port, SSL, tuning options, and specific plugins.
- **nikto_list_plugins** -- List all available Nikto plugins for targeted scanning.

### Examples

1. Basic web server scan:
   ```
   nikto_scan target="http://192.168.1.1"
   ```

2. Scan with SSL on a custom port:
   ```
   nikto_scan target="192.168.1.1" port=8443 ssl=true
   ```

3. Scan with specific tuning options:
   ```
   nikto_scan target="http://example.com" tuning="123" output="/tmp/nikto-report.txt"
   ```

4. List available plugins:
   ```
   nikto_list_plugins
   ```

### Notes

- Nikto is not designed to be stealthy; scans will be visible in server logs.
- Tuning options control which test categories to run (e.g. file upload, injection, etc.).
- Always ensure you have authorization before scanning any web server.

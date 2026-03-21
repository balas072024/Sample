---
name: privilege-escalation
version: "1.0.0"
description: "Linux and Windows privilege escalation enumeration and exploitation \u2014 LinPEAS, WinPEAS, GTFOBins."
author: ArivuClaw
tags:
  - privesc
  - escalation
  - linpeas
  - winpeas
  - suid
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - unrestricted
tools:
  - name: linpeas_run
    description: Run LinPEAS on a Linux target
    inputSchema:
      type: object
      properties:
        outputFile:
          type: string
          description: File to save LinPEAS output
        intensity:
          type: string
          enum:
            - fast
            - normal
            - full
          description: Scan intensity level
  - name: winpeas_run
    description: Run WinPEAS on a Windows target
    inputSchema:
      type: object
      properties:
        outputFile:
          type: string
          description: File to save WinPEAS output
        checks:
          type: string
          enum:
            - all
            - systeminfo
            - services
            - network
            - users
            - software
          description: Specific checks to run
  - name: gtfobins_search
    description: Search GTFOBins for exploitation techniques
    inputSchema:
      type: object
      required:
        - binary
      properties:
        binary:
          type: string
          description: Binary name to search for
        function:
          type: string
          enum:
            - shell
            - file-read
            - file-write
            - suid
            - sudo
            - capabilities
          description: Exploitation function type
  - name: lolbas_search
    description: Search LOLBAS (Living Off The Land Binaries)
    inputSchema:
      type: object
      required:
        - binary
      properties:
        binary:
          type: string
          description: Binary name to search for
        type:
          type: string
          enum:
            - execute
            - download
            - compile
            - copy
            - encode
          description: LOLBAS function type
  - name: suid_find
    description: Find SUID/SGID binaries
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Starting path for SUID/SGID search
  - name: capability_enum
    description: Enumerate Linux capabilities
    inputSchema:
      type: object
      properties: {}
  - name: sudo_enum
    description: Enumerate sudo permissions
    inputSchema:
      type: object
      properties: {}
triggers:
  - type: keyword
    value: privilege escalation
    priority: 8
  - type: keyword
    value: privesc
    priority: 9
  - type: keyword
    value: linpeas
    priority: 9
  - type: keyword
    value: winpeas
    priority: 9
  - type: keyword
    value: suid
    priority: 7
---

# Privilege Escalation — Linux and Windows

This skill provides privilege escalation enumeration and exploitation tools for both Linux and Windows systems. It integrates LinPEAS, WinPEAS, GTFOBins, and LOLBAS for comprehensive escalation path discovery.

## Capabilities

- **LinPEAS**: Automated Linux privilege escalation enumeration covering SUID binaries, writable paths, cron jobs, kernel exploits, and misconfigurations.
- **WinPEAS**: Automated Windows privilege escalation enumeration covering services, registry, scheduled tasks, and unquoted service paths.
- **GTFOBins Search**: Look up Unix binaries that can be exploited for privilege escalation through SUID, sudo, capabilities, or other mechanisms.
- **LOLBAS Search**: Look up Windows Living Off The Land Binaries and Scripts for execution, download, and other abuse functions.
- **SUID/SGID Enumeration**: Find all SUID and SGID binaries on a Linux filesystem.
- **Capability Enumeration**: Discover Linux binaries with elevated capabilities.
- **Sudo Enumeration**: List sudo permissions for the current user.

## Usage

1. Run `linpeas_run` or `winpeas_run` for automated enumeration on the respective OS.
2. Use `gtfobins_search` or `lolbas_search` to find exploitation techniques for specific binaries.
3. Enumerate SUID binaries, capabilities, and sudo permissions for manual privilege escalation paths.

## Authorization Notice

This skill is intended for **authorized security testing and penetration testing engagements only**. You must have explicit written permission from the system owner before performing any privilege escalation enumeration or exploitation. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and comply with all applicable laws and regulations.

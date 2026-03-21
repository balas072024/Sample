---
name: privilege-escalation
version: "1.0.0"
description: "Linux and Windows privilege escalation enumeration and exploitation — LinPEAS, WinPEAS, GTFOBins."
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
          enum: [fast, normal, full]
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
          enum: [all, systeminfo, services, network, users, software]
          description: Categories of checks to run
  - name: gtfobins_search
    description: Search GTFOBins for exploitation techniques
    inputSchema:
      type: object
      properties:
        binary:
          type: string
          description: Binary name to search for
        function:
          type: string
          enum: [shell, file-read, file-write, suid, sudo, capabilities]
          description: Exploitation function type
      required: [binary]
  - name: lolbas_search
    description: Search LOLBAS (Living Off The Land Binaries)
    inputSchema:
      type: object
      properties:
        binary:
          type: string
          description: Binary name to search for
        type:
          type: string
          enum: [execute, download, compile, copy, encode]
          description: LOLBAS technique type
      required: [binary]
  - name: suid_find
    description: Find SUID/SGID binaries
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: Root path to search from (default /)
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
    pattern: privilege escalation
    priority: 8
  - type: keyword
    pattern: privesc
    priority: 9
  - type: keyword
    pattern: linpeas
    priority: 9
  - type: keyword
    pattern: winpeas
    priority: 9
  - type: keyword
    pattern: suid
    priority: 7
---

# Privilege Escalation — Linux and Windows

This skill provides privilege escalation enumeration and exploitation capabilities for both Linux and Windows targets using industry-standard tools.

## Capabilities

- **LinPEAS**: Comprehensive Linux privilege escalation enumeration covering SUID binaries, cron jobs, writable paths, kernel exploits, and more.
- **WinPEAS**: Comprehensive Windows privilege escalation enumeration covering services, registry, scheduled tasks, token privileges, and more.
- **GTFOBins Search**: Look up any Linux binary in the GTFOBins database to find shell escapes, file read/write, SUID, sudo, and capability abuse techniques.
- **LOLBAS Search**: Look up Windows binaries in the Living Off The Land Binaries and Scripts database for execution, download, compile, copy, and encode techniques.
- **SUID/SGID Finder**: Enumerate all SUID and SGID binaries on the filesystem.
- **Capability Enumeration**: List all binaries with Linux capabilities set.
- **Sudo Enumeration**: Check current user's sudo permissions for exploitable entries.

## Usage

1. Run `linpeas_run` or `winpeas_run` for automated enumeration on the respective OS.
2. Use `suid_find`, `capability_enum`, or `sudo_enum` for targeted checks.
3. Cross-reference findings with `gtfobins_search` or `lolbas_search` for exploitation techniques.

## Requirements

- LinPEAS/WinPEAS scripts available on the target
- Shell access to the target system
- For GTFOBins/LOLBAS lookups, internet access or a local database

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before running privilege escalation tools on any system. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical.

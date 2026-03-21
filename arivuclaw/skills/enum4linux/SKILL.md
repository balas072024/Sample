---
name: enum4linux
version: "1.0.0"
description: "Windows/Samba system enumeration. Users, shares, groups, password policies, OS info."
author: ArivuClaw
tags:
  - enum4linux
  - smb
  - windows
  - enum
  - samba
permissions:
  - network.tcp
  - system.process
  - code.execute
tools:
  - name: enum4linux_scan
    description: "Full enumeration of a target Windows/Samba system"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target IP address or hostname"
        username:
          type: string
          description: "Username for authenticated enumeration"
        password:
          type: string
          description: "Password for authenticated enumeration"
        options:
          type: array
          items:
            type: string
            enum:
              - users
              - shares
              - groups
              - policies
              - os
              - all
          description: "Enumeration options to enable"
  - name: enum4linux_shares
    description: "Enumerate SMB shares on a target"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target IP address or hostname"
        username:
          type: string
          description: "Username for authenticated access"
        password:
          type: string
          description: "Password for authenticated access"
  - name: enum4linux_users
    description: "Enumerate users via RID cycling"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target IP address or hostname"
        ridRange:
          type: string
          description: "RID range to cycle through (e.g. '500-550')"
triggers:
  - type: keyword
    pattern: "enum4linux"
    priority: 9
  - type: keyword
    pattern: "smb enum"
    priority: 8
  - type: keyword
    pattern: "windows enum"
    priority: 7
environment:
  binaries:
    - enum4linux
---

# Enum4Linux

Windows and Samba system enumeration skill for discovering users, shares, groups, password policies, and OS information.

## Usage

Use this skill to enumerate information from Windows and Samba systems via SMB. Supports both anonymous and authenticated enumeration.

### Tools

- **enum4linux_scan** -- Perform a full enumeration of a target system. Select specific enumeration options (users, shares, groups, policies, OS) or use "all" for comprehensive enumeration.
- **enum4linux_shares** -- Enumerate available SMB shares on a target, including permissions and access levels.
- **enum4linux_users** -- Enumerate user accounts via RID cycling, which can discover users even when null sessions are restricted.

### Examples

1. Full enumeration of a target:
   ```
   enum4linux_scan target="192.168.1.10" options=["all"]
   ```

2. Enumerate with credentials:
   ```
   enum4linux_scan target="192.168.1.10" username="admin" password="pass123" options=["users", "shares", "groups"]
   ```

3. Enumerate SMB shares:
   ```
   enum4linux_shares target="192.168.1.10"
   ```

4. Enumerate users via RID cycling:
   ```
   enum4linux_users target="192.168.1.10" ridRange="500-600"
   ```

5. OS information only:
   ```
   enum4linux_scan target="192.168.1.10" options=["os"]
   ```

### Notes

- Anonymous (null session) enumeration may be restricted on hardened systems.
- RID cycling can discover users even when standard enumeration methods fail.
- Authenticated enumeration provides more complete results.
- SMB enumeration can trigger security alerts on monitored networks.
- Always ensure you have authorization before enumerating any target.

---
name: reverse-shell
version: "1.0.0"
description: "Generate reverse shell one-liners and listeners for authorized penetration testing."
author: Arivumaiyam AI
tags:
  - reverse-shell
  - shell
  - listener
  - pentest
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: revshell_generate
    description: Generate a reverse shell command.
    inputSchema:
      type: object
      required:
        - type
        - lhost
        - lport
      properties:
        type:
          type: string
          enum:
            - bash
            - python
            - php
            - perl
            - ruby
            - powershell
            - netcat
            - java
            - go
            - lua
          description: Language or tool for the reverse shell.
        lhost:
          type: string
          description: Local host (attacker IP) to connect back to.
        lport:
          type: number
          description: Local port (attacker port) to connect back to.
        encoded:
          type: boolean
          description: Whether to base64-encode the reverse shell command.
  - name: revshell_listener
    description: Start a reverse shell listener.
    inputSchema:
      type: object
      required:
        - lhost
        - lport
      properties:
        lhost:
          type: string
          description: Local host to listen on.
        lport:
          type: number
          description: Local port to listen on.
        type:
          type: string
          enum:
            - netcat
            - socat
            - metasploit
          description: Listener type.
        pty:
          type: boolean
          description: Allocate a pseudo-terminal for the listener.
  - name: revshell_upgrade
    description: Upgrade a basic shell to a fully interactive TTY.
    inputSchema:
      type: object
      properties:
        method:
          type: string
          enum:
            - python
            - script
            - socat
            - expect
          description: Method to use for shell upgrade.
triggers:
  - type: keyword
    value: reverse shell
    priority: 9
  - type: keyword
    value: revshell
    priority: 9
  - type: keyword
    value: listener
    priority: 5
---

# Reverse Shell

This skill provides reverse shell generation, listener management, and shell upgrade capabilities for authorized penetration testing.

## Capabilities

- **revshell_generate** — Generate reverse shell one-liners in multiple languages and tools including Bash, Python, PHP, Perl, Ruby, PowerShell, Netcat, Java, Go, and Lua, with optional base64 encoding.
- **revshell_listener** — Start a reverse shell listener using Netcat, Socat, or Metasploit with optional PTY allocation.
- **revshell_upgrade** — Upgrade a basic non-interactive shell to a fully interactive TTY using Python, script, Socat, or Expect.

## Instructions

1. Use `revshell_generate` to create a reverse shell command appropriate for the target system and available interpreters.
2. Start a listener with `revshell_listener` before executing the reverse shell on the target.
3. After obtaining a basic shell, use `revshell_upgrade` to get a fully interactive TTY with proper terminal handling.
4. Always ensure the target system is within your authorized testing scope.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

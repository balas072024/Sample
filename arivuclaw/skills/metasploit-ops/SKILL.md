---
name: metasploit-ops
version: "1.0.0"
description: "Metasploit Framework — exploit development, payload generation, post-exploitation, and auxiliary modules."
author: Arivumaiyam AI
tags:
  - metasploit
  - msf
  - exploit
  - payload
  - pentest
permissions:
  - network.tcp
  - network.http
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: msf_search
    description: Search for exploits, payloads, and modules.
    inputSchema:
      type: object
      required:
        - query
      properties:
        query:
          type: string
          description: Search query for modules.
        type:
          type: string
          enum:
            - exploit
            - payload
            - auxiliary
            - post
            - encoder
          description: Type of module to search for.
  - name: msf_exploit
    description: Run an exploit module.
    inputSchema:
      type: object
      required:
        - module
        - rhosts
      properties:
        module:
          type: string
          description: Exploit module path (e.g. exploit/windows/smb/ms17_010_eternalblue).
        rhosts:
          type: string
          description: Target host(s).
        rport:
          type: number
          description: Target port.
        payload:
          type: string
          description: Payload to deliver.
        lhost:
          type: string
          description: Local host for reverse connections.
        lport:
          type: number
          description: Local port for reverse connections.
        options:
          type: object
          description: Additional module options as key-value pairs.
  - name: msf_auxiliary
    description: Run an auxiliary module (scanners, fuzzers, etc).
    inputSchema:
      type: object
      required:
        - module
        - rhosts
      properties:
        module:
          type: string
          description: Auxiliary module path.
        rhosts:
          type: string
          description: Target host(s).
        options:
          type: object
          description: Additional module options as key-value pairs.
  - name: msf_payload
    description: Generate a payload.
    inputSchema:
      type: object
      required:
        - payload
        - lhost
        - lport
      properties:
        payload:
          type: string
          description: Payload name (e.g. windows/meterpreter/reverse_tcp).
        lhost:
          type: string
          description: Local host for the payload callback.
        lport:
          type: number
          description: Local port for the payload callback.
        format:
          type: string
          enum:
            - exe
            - elf
            - raw
            - python
            - bash
            - powershell
            - apk
          description: Output format.
        encoder:
          type: string
          description: Encoder to use (e.g. x86/shikata_ga_nai).
        iterations:
          type: number
          description: Number of encoding iterations.
        output:
          type: string
          description: Output file path.
  - name: msf_post
    description: Run a post-exploitation module.
    inputSchema:
      type: object
      required:
        - module
        - session
      properties:
        module:
          type: string
          description: Post-exploitation module path.
        session:
          type: number
          description: Active session ID to run the module against.
        options:
          type: object
          description: Additional module options as key-value pairs.
  - name: msf_sessions
    description: List and interact with active sessions.
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum:
            - list
            - interact
            - kill
          description: Action to perform on sessions.
        sessionId:
          type: number
          description: Session ID to interact with or kill.
  - name: msf_db
    description: Database operations (hosts, services, vulns, creds).
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum:
            - hosts
            - services
            - vulns
            - creds
            - import
          description: Database operation to perform.
        query:
          type: string
          description: Query or filter string.
triggers:
  - type: keyword
    value: metasploit
    priority: 9
  - type: keyword
    value: msf
    priority: 9
  - type: keyword
    value: exploit
    priority: 6
environment:
  binaries:
    - msfconsole
---

# Metasploit Ops

This skill provides full access to the Metasploit Framework for exploit development, payload generation, post-exploitation, and auxiliary module execution.

## Capabilities

- **msf_search** — Search the Metasploit module database for exploits, payloads, auxiliaries, post-exploitation modules, and encoders.
- **msf_exploit** — Configure and launch an exploit module against a target, specifying payload, listener options, and advanced settings.
- **msf_auxiliary** — Run auxiliary modules such as port scanners, service enumerators, and protocol fuzzers.
- **msf_payload** — Generate standalone payloads in various formats with optional encoding and iteration counts.
- **msf_post** — Execute post-exploitation modules on active sessions for privilege escalation, credential harvesting, and lateral movement.
- **msf_sessions** — List, interact with, or terminate active Meterpreter and shell sessions.
- **msf_db** — Query the Metasploit database for discovered hosts, services, vulnerabilities, and credentials.

## Instructions

1. Ensure `msfconsole` is installed and the Metasploit database is initialized (`msfdb init`).
2. Use `msf_search` to locate the appropriate module before launching exploits.
3. Always verify target scope and authorization before running any exploit or auxiliary module.
4. Use `msf_sessions` to manage active sessions and clean up after testing.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

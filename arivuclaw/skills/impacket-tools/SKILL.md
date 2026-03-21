---
name: impacket-tools
version: "1.0.0"
description: "Impacket network protocol toolkit — SMB, NTLM, Kerberos, WMI, DCOM, MSSQL attacks."
author: Arivumaiyam AI
tags:
  - impacket
  - smb
  - kerberos
  - wmi
  - ntlm
  - windows
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: impacket_psexec
    description: Remote command execution via PSExec
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        domain:
          type: string
          description: Domain name
        command:
          type: string
          description: Command to execute on the target
      required: [target, username]
  - name: impacket_smbexec
    description: Remote command execution via SMBExec
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        command:
          type: string
          description: Command to execute on the target
      required: [target, username]
  - name: impacket_wmiexec
    description: Remote command execution via WMI
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        command:
          type: string
          description: Command to execute on the target
      required: [target, username]
  - name: impacket_secretsdump
    description: Dump credentials from a target
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        domain:
          type: string
          description: Domain name
        just_dc:
          type: boolean
          description: Extract only NTDS.DIT data (DRSUAPI method)
      required: [target, username]
  - name: impacket_kerberoast
    description: Kerberoasting attack for SPN hashes
    inputSchema:
      type: object
      properties:
        domain:
          type: string
          description: Target domain
        username:
          type: string
          description: Domain username
        password:
          type: string
          description: Domain password
        dc:
          type: string
          description: Domain controller IP or hostname
        outputFile:
          type: string
          description: File to save extracted hashes
      required: [domain, username]
  - name: impacket_getTGT
    description: Request a Kerberos TGT
    inputSchema:
      type: object
      properties:
        domain:
          type: string
          description: Target domain
        username:
          type: string
          description: Domain username
        password:
          type: string
          description: Domain password
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        dc:
          type: string
          description: Domain controller IP or hostname
      required: [domain, username]
  - name: impacket_smbclient
    description: Interactive SMB client
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        share:
          type: string
          description: SMB share name to connect to
      required: [target]
triggers:
  - type: keyword
    pattern: impacket
    priority: 9
  - type: keyword
    pattern: psexec
    priority: 8
  - type: keyword
    pattern: kerberoast
    priority: 9
  - type: keyword
    pattern: secretsdump
    priority: 9
---

# Impacket Tools — Network Protocol Toolkit

This skill provides access to the Impacket suite of tools for interacting with Windows network protocols including SMB, NTLM, Kerberos, WMI, DCOM, and MSSQL.

## Capabilities

- **PSExec**: Remote command execution using the PSExec technique over SMB.
- **SMBExec**: Stealthier remote command execution via SMB service creation.
- **WMIExec**: Semi-interactive shell via Windows Management Instrumentation.
- **SecretsDump**: Extract credentials including SAM, LSA secrets, and NTDS.DIT hashes.
- **Kerberoasting**: Request and extract service ticket hashes for offline cracking.
- **GetTGT**: Request Kerberos Ticket Granting Tickets for authentication.
- **SMBClient**: Browse and interact with SMB shares on remote hosts.

## Usage

All tools support authentication via plaintext passwords or NTLM hashes (pass-the-hash). Provide either `password` or `hash` for authentication.

## Requirements

- Impacket Python library installed (`pip install impacket`)
- Network connectivity to target hosts
- Valid credentials (password or NTLM hash)

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before executing any commands against target systems. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical.

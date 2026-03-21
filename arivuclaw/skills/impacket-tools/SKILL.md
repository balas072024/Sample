---
name: impacket-tools
version: "1.0.0"
description: "Impacket network protocol toolkit \u2014 SMB, NTLM, Kerberos, WMI, DCOM, MSSQL attacks."
author: ArivuClaw
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
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target host IP or hostname
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
  - name: impacket_smbexec
    description: Remote command execution via SMBExec
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target host IP or hostname
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
  - name: impacket_wmiexec
    description: Remote command execution via WMI
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target host IP or hostname
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
  - name: impacket_secretsdump
    description: Dump credentials from a target
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target host IP or hostname
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
  - name: impacket_kerberoast
    description: Kerberoasting attack for SPN hashes
    inputSchema:
      type: object
      required:
        - domain
        - username
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
  - name: impacket_getTGT
    description: Request a Kerberos TGT
    inputSchema:
      type: object
      required:
        - domain
        - username
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
          description: NTLM hash for authentication
        dc:
          type: string
          description: Domain controller IP or hostname
  - name: impacket_smbclient
    description: Interactive SMB client
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: Target host IP or hostname
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        share:
          type: string
          description: SMB share name to connect to
triggers:
  - type: keyword
    value: impacket
    priority: 9
  - type: keyword
    value: psexec
    priority: 8
  - type: keyword
    value: kerberoast
    priority: 9
  - type: keyword
    value: secretsdump
    priority: 9
---

# Impacket Tools — Network Protocol Toolkit

This skill provides access to the Impacket suite of tools for interacting with Windows network protocols. It supports SMB, NTLM, Kerberos, WMI, and DCOM-based attacks commonly used during penetration testing and red team engagements.

## Capabilities

- **PSExec**: Remote command execution using the PSExec technique over SMB, supporting both password and pass-the-hash authentication.
- **SMBExec**: Stealthier alternative to PSExec using SMB for remote command execution.
- **WMIExec**: Remote command execution through Windows Management Instrumentation.
- **SecretsDump**: Extract credentials including SAM hashes, LSA secrets, cached domain credentials, and NTDS.DIT via DRSUAPI.
- **Kerberoasting**: Request and extract service ticket hashes for offline cracking of service account passwords.
- **GetTGT**: Request Kerberos Ticket Granting Tickets for use in further attacks.
- **SMB Client**: Interactive SMB client for browsing shares and transferring files.

## Usage

1. Select the appropriate tool based on your engagement needs and available credentials.
2. Provide target, authentication, and command parameters.
3. Use extracted credentials for further lateral movement or privilege escalation.

## Authorization Notice

This skill is intended for **authorized security testing and penetration testing engagements only**. You must have explicit written permission from the system owner before executing any remote commands, dumping credentials, or performing Kerberos attacks. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and comply with all applicable laws and regulations.

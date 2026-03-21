---
name: lateral-movement
version: "1.0.0"
description: "Lateral movement techniques \u2014 Pass-the-Hash, Pass-the-Ticket, over-pass-the-hash, token impersonation."
author: ArivuClaw
tags:
  - lateral
  - pth
  - ptt
  - movement
  - windows
  - ad
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: pth_attack
    description: Pass-the-Hash attack
    inputSchema:
      type: object
      required:
        - target
        - username
        - hash
      properties:
        target:
          type: string
          description: Target host IP or hostname
        username:
          type: string
          description: Username for authentication
        hash:
          type: string
          description: NTLM hash for pass-the-hash
        domain:
          type: string
          description: Domain name
        tool:
          type: string
          enum:
            - impacket
            - mimikatz
            - evil-winrm
          description: Tool to use for the attack
        command:
          type: string
          description: Command to execute on the target
  - name: ptt_attack
    description: Pass-the-Ticket attack
    inputSchema:
      type: object
      required:
        - ticketFile
      properties:
        ticketFile:
          type: string
          description: Path to the Kerberos ticket file (.kirbi or .ccache)
        target:
          type: string
          description: Target host IP or hostname
        command:
          type: string
          description: Command to execute on the target
  - name: evil_winrm
    description: Connect via Evil-WinRM
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
        ssl:
          type: boolean
          description: Enable SSL connection
        scripts:
          type: string
          description: Path to PowerShell scripts directory
  - name: rdp_connect
    description: RDP connection (with pass-the-hash if supported)
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
  - name: token_impersonate
    description: Token impersonation techniques
    inputSchema:
      type: object
      properties:
        method:
          type: string
          enum:
            - incognito
            - potato
            - printspoofer
          description: Token impersonation method
        target:
          type: string
          description: Target process or user
triggers:
  - type: keyword
    value: lateral movement
    priority: 8
  - type: keyword
    value: pass the hash
    priority: 9
  - type: keyword
    value: pth
    priority: 8
  - type: keyword
    value: evil-winrm
    priority: 9
---

# Lateral Movement — Pass-the-Hash, Pass-the-Ticket, Token Impersonation

This skill provides lateral movement techniques for navigating through Windows and Active Directory environments after initial compromise. It supports Pass-the-Hash, Pass-the-Ticket, Evil-WinRM, RDP, and token impersonation methods.

## Capabilities

- **Pass-the-Hash (PtH)**: Authenticate to remote systems using NTLM hashes without knowing the plaintext password, via Impacket, Mimikatz, or Evil-WinRM.
- **Pass-the-Ticket (PtT)**: Use stolen Kerberos tickets to authenticate and access services on remote systems.
- **Evil-WinRM**: Establish interactive PowerShell sessions on remote hosts via WinRM with password or hash authentication.
- **RDP Connection**: Connect to remote desktops with standard credentials or pass-the-hash where supported.
- **Token Impersonation**: Escalate privileges or move laterally by impersonating tokens using Incognito, Potato exploits, or PrintSpoofer.

## Usage

1. Obtain credentials or hashes through credential dumping or other means.
2. Select the appropriate lateral movement technique based on available credentials and target services.
3. Use `pth_attack` for hash-based access, `ptt_attack` for ticket-based access, or `evil_winrm` for interactive sessions.
4. Leverage `token_impersonate` for local privilege escalation via token manipulation.

## Authorization Notice

This skill is intended for **authorized security testing and penetration testing engagements only**. You must have explicit written permission from the system owner before performing any lateral movement, credential relay, or token impersonation attacks. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and comply with all applicable laws and regulations.

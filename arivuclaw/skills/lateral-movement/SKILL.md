---
name: lateral-movement
version: "1.0.0"
description: "Lateral movement techniques — Pass-the-Hash, Pass-the-Ticket, over-pass-the-hash, token impersonation."
author: Arivumaiyam AI
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
      properties:
        target:
          type: string
          description: Target host (IP or hostname)
        username:
          type: string
          description: Username to authenticate as
        hash:
          type: string
          description: NTLM hash for authentication
        domain:
          type: string
          description: Domain name
        tool:
          type: string
          enum: [impacket, mimikatz, evil-winrm]
          description: Tool to use for pass-the-hash
        command:
          type: string
          description: Command to execute on the target
      required: [target, username, hash]
  - name: ptt_attack
    description: Pass-the-Ticket attack
    inputSchema:
      type: object
      properties:
        ticketFile:
          type: string
          description: Path to Kerberos ticket file (.kirbi or .ccache)
        target:
          type: string
          description: Target host (IP or hostname)
        command:
          type: string
          description: Command to execute
      required: [ticketFile]
  - name: evil_winrm
    description: Connect via Evil-WinRM
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
        ssl:
          type: boolean
          description: Use SSL for the connection
        scripts:
          type: string
          description: Path to PowerShell scripts directory
      required: [target, username]
  - name: rdp_connect
    description: RDP connection (with pass-the-hash if supported)
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
      required: [target, username]
  - name: token_impersonate
    description: Token impersonation techniques
    inputSchema:
      type: object
      properties:
        method:
          type: string
          enum: [incognito, potato, printspoofer]
          description: Impersonation method to use
        target:
          type: string
          description: Target process or service
triggers:
  - type: keyword
    pattern: lateral movement
    priority: 8
  - type: keyword
    pattern: pass the hash
    priority: 9
  - type: keyword
    pattern: pth
    priority: 8
  - type: keyword
    pattern: evil-winrm
    priority: 9
---

# Lateral Movement — Pass-the-Hash, Pass-the-Ticket, and More

This skill provides lateral movement techniques for navigating Windows and Active Directory environments after initial compromise.

## Capabilities

- **Pass-the-Hash (PtH)**: Authenticate to remote systems using NTLM hashes without knowing the plaintext password, via Impacket, Mimikatz, or Evil-WinRM.
- **Pass-the-Ticket (PtT)**: Inject Kerberos tickets (.kirbi or .ccache) to authenticate as another user without their credentials.
- **Evil-WinRM**: Establish a PowerShell remoting session to Windows hosts with password or hash-based authentication and script loading.
- **RDP Connection**: Connect to remote desktops with credentials or pass-the-hash where supported.
- **Token Impersonation**: Escalate privileges or move laterally using Incognito, Potato exploits, or PrintSpoofer techniques.

## Usage

1. Obtain credentials or NTLM hashes from initial compromise (e.g., via secretsdump or mimikatz).
2. Use `pth_attack` or `ptt_attack` to authenticate to remote targets.
3. Establish interactive sessions with `evil_winrm` or `rdp_connect`.
4. Use `token_impersonate` for local privilege escalation via token abuse.

## Requirements

- Valid NTLM hashes or Kerberos tickets
- Network connectivity to target hosts
- Appropriate tools installed (Impacket, Evil-WinRM, Mimikatz)

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before performing lateral movement against any target environment. Unauthorized use of these techniques against systems you do not own or have permission to test is illegal and unethical.

---
name: crackmapexec
version: "1.0.0"
description: "CrackMapExec/NetExec \u2014 Swiss army knife for pentesting Windows/AD networks. SMB, WinRM, LDAP, MSSQL, SSH."
author: ArivuClaw
tags:
  - crackmapexec
  - netexec
  - cme
  - smb
  - winrm
  - ad
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: cme_smb
    description: "SMB operations (enum, exec, spray, dump)"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: Target IP, hostname, or CIDR range
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
        action:
          type: string
          enum:
            - enum_shares
            - enum_users
            - enum_groups
            - spider
            - exec
            - sam
            - lsa
            - ntds
          description: SMB action to perform
        command:
          type: string
          description: Command to execute (used with exec action)
        module:
          type: string
          description: CrackMapExec module to load
  - name: cme_winrm
    description: WinRM operations
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target IP or hostname
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
          description: Command to execute
  - name: cme_ldap
    description: LDAP enumeration
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target domain controller
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        action:
          type: string
          enum:
            - users
            - groups
            - computers
            - trusts
            - bloodhound
            - kerberoast
          description: LDAP enumeration action
  - name: cme_mssql
    description: MSSQL operations
    inputSchema:
      type: object
      required:
        - target
        - username
      properties:
        target:
          type: string
          description: Target MSSQL server
        username:
          type: string
          description: Username for authentication
        password:
          type: string
          description: Password for authentication
        query:
          type: string
          description: SQL query to execute
        action:
          type: string
          enum:
            - query
            - xp_cmdshell
            - enum
          description: MSSQL action to perform
  - name: cme_spray
    description: Password spraying
    inputSchema:
      type: object
      required:
        - target
        - userFile
        - password
      properties:
        target:
          type: string
          description: Target IP, hostname, or CIDR range
        userFile:
          type: string
          description: File containing list of usernames
        password:
          type: string
          description: Password to spray
        protocol:
          type: string
          enum:
            - smb
            - winrm
            - ldap
            - ssh
          description: Protocol to use for spraying
triggers:
  - type: keyword
    value: crackmapexec
    priority: 9
  - type: keyword
    value: cme
    priority: 8
  - type: keyword
    value: netexec
    priority: 9
---

# CrackMapExec — Windows/AD Network Pentesting

This skill provides access to CrackMapExec (also known as NetExec), a comprehensive tool for pentesting Windows and Active Directory networks. It supports multiple protocols including SMB, WinRM, LDAP, MSSQL, and SSH.

## Capabilities

- **SMB Operations**: Enumerate shares, users, and groups; execute commands; dump SAM, LSA, and NTDS credentials; spider shares for sensitive files.
- **WinRM Operations**: Execute commands on remote hosts via Windows Remote Management.
- **LDAP Enumeration**: Enumerate users, groups, computers, and domain trusts; perform BloodHound collection and Kerberoasting via LDAP.
- **MSSQL Operations**: Execute SQL queries, run OS commands via xp_cmdshell, and enumerate database information.
- **Password Spraying**: Spray a single password across a list of users over multiple protocols to identify valid credentials.

## Usage

1. Choose the appropriate protocol tool based on the available attack surface.
2. Provide target, credentials, and the desired action.
3. Review output for valid credentials, accessible shares, and further attack paths.

## Authorization Notice

This skill is intended for **authorized security testing and penetration testing engagements only**. You must have explicit written permission from the system owner before performing any network enumeration, credential spraying, or command execution. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and comply with all applicable laws and regulations.

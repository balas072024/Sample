---
name: crackmapexec
version: "1.0.0"
description: "CrackMapExec/NetExec — Swiss army knife for pentesting Windows/AD networks. SMB, WinRM, LDAP, MSSQL, SSH."
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
    description: SMB operations (enum, exec, spray, dump)
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host, IP range, or CIDR
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
          enum: [enum_shares, enum_users, enum_groups, spider, exec, sam, lsa, ntds]
          description: Action to perform
        command:
          type: string
          description: Command to execute (when action is exec)
        module:
          type: string
          description: CME module to load
      required: [target]
  - name: cme_winrm
    description: WinRM operations
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host or IP
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
      required: [target, username]
  - name: cme_ldap
    description: LDAP enumeration
    inputSchema:
      type: object
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
          enum: [users, groups, computers, trusts, bloodhound, kerberoast]
          description: LDAP enumeration action
      required: [target, username]
  - name: cme_mssql
    description: MSSQL operations
    inputSchema:
      type: object
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
          enum: [query, xp_cmdshell, enum]
          description: MSSQL action to perform
      required: [target, username]
  - name: cme_spray
    description: Password spraying
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host, IP range, or CIDR
        userFile:
          type: string
          description: File containing list of usernames
        password:
          type: string
          description: Password to spray
        protocol:
          type: string
          enum: [smb, winrm, ldap, ssh]
          description: Protocol to use for spraying
      required: [target, userFile, password]
triggers:
  - type: keyword
    pattern: crackmapexec
    priority: 9
  - type: keyword
    pattern: cme
    priority: 8
  - type: keyword
    pattern: netexec
    priority: 9
---

# CrackMapExec — Windows/AD Network Pentesting

This skill provides access to CrackMapExec (CME) / NetExec, a Swiss army knife for pentesting Windows and Active Directory networks across multiple protocols.

## Capabilities

- **SMB**: Enumerate shares, users, groups; execute commands; dump SAM, LSA secrets, and NTDS.DIT; spider shares for sensitive files.
- **WinRM**: Remote command execution via Windows Remote Management.
- **LDAP**: Enumerate domain users, groups, computers, trusts; perform Kerberoasting and BloodHound collection.
- **MSSQL**: Query databases, execute OS commands via xp_cmdshell, enumerate server configuration.
- **Password Spraying**: Spray a single password across multiple users on SMB, WinRM, LDAP, or SSH.

## Usage

Specify a target (single IP, range, or CIDR) along with credentials. Choose an action appropriate to the protocol. All tools support pass-the-hash via the `hash` parameter.

## Requirements

- CrackMapExec or NetExec installed
- Network connectivity to target hosts
- Valid credentials for authenticated operations

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before performing any enumeration, credential spraying, or command execution against target systems. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical.

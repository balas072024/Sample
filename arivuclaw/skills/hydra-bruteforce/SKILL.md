---
name: hydra-bruteforce
version: "1.0.0"
description: "Fast network login brute-forcer. Supports SSH, FTP, HTTP, SMB, RDP, MySQL, and 50+ protocols."
author: ArivuClaw
tags:
  - hydra
  - bruteforce
  - login
  - password
  - network
permissions:
  - network.tcp
  - network.http
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: hydra_attack
    description: Run a brute-force attack against a network service
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host or IP address
        service:
          type: string
          enum:
            - ssh
            - ftp
            - http-get
            - http-post
            - smb
            - rdp
            - mysql
            - postgres
            - vnc
            - telnet
            - smtp
            - pop3
            - imap
          description: Target service/protocol to attack
        username:
          type: string
          description: Single username to test
        userlist:
          type: string
          description: Path to a file containing usernames
        password:
          type: string
          description: Single password to test
        passlist:
          type: string
          description: Path to a file containing passwords
        threads:
          type: number
          description: Number of parallel threads
        port:
          type: number
          description: Target port number (overrides default)
        options:
          type: string
          description: Additional Hydra options
      required:
        - target
        - service
  - name: hydra_http_form
    description: Brute-force an HTTP form-based login
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host or IP address
        url:
          type: string
          description: URL path of the login form
        formData:
          type: string
          description: "POST data with ^USER^ and ^PASS^ placeholders"
        failString:
          type: string
          description: String that indicates a failed login attempt
        userlist:
          type: string
          description: Path to a file containing usernames
        passlist:
          type: string
          description: Path to a file containing passwords
      required:
        - target
        - url
        - formData
        - failString
triggers:
  - type: keyword
    value: "hydra"
    priority: 9
  - type: keyword
    value: "brute force"
    priority: 7
  - type: keyword
    value: "login attack"
    priority: 7
environment:
  binaries:
    - hydra
---

# Hydra Network Login Brute-Forcer

This skill provides an interface to THC-Hydra, a fast and flexible online password cracking tool. It supports brute-force attacks against more than 50 network protocols including SSH, FTP, HTTP, SMB, RDP, and database services.

## Capabilities

- **Multi-Protocol Support**: Attack SSH, FTP, HTTP, SMB, RDP, MySQL, PostgreSQL, VNC, and many more.
- **HTTP Form Attacks**: Brute-force web application login forms with custom POST data.
- **Parallel Connections**: Configurable thread count for faster attacks.
- **Flexible Input**: Support for single credentials or wordlist files.

## Usage

1. Use `hydra_attack` to brute-force a network service with username/password lists.
2. Use `hydra_http_form` to attack web login forms with custom parameters.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against systems and accounts you have explicit written permission to test. Unauthorized brute-force attacks are illegal and may cause service disruption. Always obtain proper authorization before conducting any login testing activities.

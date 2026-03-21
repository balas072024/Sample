---
name: hydra-bruteforce
version: "1.0.0"
description: "Fast network login brute-forcer. Supports SSH, FTP, HTTP, SMB, RDP, MySQL, and 50+ protocols."
author: Arivumaiyam AI
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
          enum: [ssh, ftp, http-get, http-post, smb, rdp, mysql, postgres, vnc, telnet, smtp, pop3, imap]
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
          description: Custom port number for the service
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
          description: "Form data string with ^USER^ and ^PASS^ placeholders"
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
    pattern: "hydra"
    priority: 9
  - type: keyword
    pattern: "brute force"
    priority: 7
  - type: keyword
    pattern: "login attack"
    priority: 7
environment:
  binaries:
    - hydra
---

# Hydra Network Login Brute-Forcer

This skill provides an interface to THC-Hydra, a fast and flexible network login brute-forcer supporting SSH, FTP, HTTP, SMB, RDP, MySQL, and 50+ protocols.

## Usage

- **hydra_attack** — Launch a brute-force or dictionary attack against a network service.
- **hydra_http_form** — Brute-force HTTP form-based authentication pages.

## Instructions

1. Specify the target host and service protocol for the attack.
2. Provide either a single username/password or a wordlist file for each.
3. Adjust thread count and port as needed for the target environment.
4. For HTTP form attacks, supply the form URL, POST data with placeholders, and a failure indicator string.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the system owner before running any brute-force operations. Unauthorized use of this tool against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

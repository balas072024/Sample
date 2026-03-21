---
name: password-attacks
version: "1.0.0"
description: "Comprehensive password attack toolkit — generation, mutation, spraying, credential stuffing."
author: ArivuClaw
tags:
  - password
  - wordlist
  - spray
  - credentials
  - attack
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - filesystem.write
  - unrestricted
tools:
  - name: wordlist_generate
    description: Generate custom wordlists using CUPP, CeWL, or crunch
    inputSchema:
      type: object
      properties:
        tool:
          type: string
          enum:
            - cupp
            - cewl
            - crunch
          description: Wordlist generation tool to use
        options:
          type: object
          description: Tool-specific options and configuration
        output:
          type: string
          description: Output file path for the generated wordlist
      required:
        - tool
        - output
  - name: password_spray
    description: Password spraying attack against a service
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host or IP address
        service:
          type: string
          description: Target service (e.g., smb, ldap, ssh, owa)
        users:
          type: string
          description: Path to the user list file
        password:
          type: string
          description: Single password to spray across all users
        delay:
          type: number
          description: Delay in seconds between attempts to avoid lockout
      required:
        - target
        - service
        - users
        - password
  - name: credential_check
    description: Test a list of credentials against a service
    inputSchema:
      type: object
      properties:
        target:
          type: string
          description: Target host or IP address
        service:
          type: string
          description: Target service to test credentials against
        credentialFile:
          type: string
          description: "Path to credentials file (user:pass format)"
        threads:
          type: number
          description: Number of parallel threads
      required:
        - target
        - service
        - credentialFile
  - name: hash_identify
    description: Identify the type of a given hash string
    inputSchema:
      type: object
      properties:
        hash:
          type: string
          description: The hash string to identify
      required:
        - hash
  - name: hash_generate
    description: Generate hashes for testing purposes
    inputSchema:
      type: object
      properties:
        plaintext:
          type: string
          description: The plaintext string to hash
        algorithm:
          type: string
          enum:
            - md5
            - sha1
            - sha256
            - sha512
            - ntlm
            - bcrypt
            - argon2
          description: Hashing algorithm to use
      required:
        - plaintext
triggers:
  - type: keyword
    value: "password attack"
    priority: 8
  - type: keyword
    value: "wordlist"
    priority: 7
  - type: keyword
    value: "credential"
    priority: 5
  - type: keyword
    value: "spray"
    priority: 7
---

# Password Attacks Toolkit

This skill provides a comprehensive set of password attack tools covering wordlist generation, password spraying, credential stuffing, and hash operations.

## Capabilities

- **Wordlist Generation**: Create custom wordlists with CUPP (profiling-based), CeWL (web scraping), or crunch (pattern-based).
- **Password Spraying**: Test a single password against many user accounts with configurable delays to avoid lockout.
- **Credential Stuffing**: Validate leaked or collected credentials against target services.
- **Hash Identification**: Determine the algorithm used to produce a given hash.
- **Hash Generation**: Generate hashes in various formats for testing and comparison.

## Usage

1. Use `wordlist_generate` to create targeted wordlists for an engagement.
2. Use `password_spray` to test common passwords across many accounts.
3. Use `credential_check` to validate credential lists against a service.
4. Use `hash_identify` to determine unknown hash types.
5. Use `hash_generate` to create test hashes in supported formats.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against systems and accounts you have explicit written permission to test. Unauthorized password attacks are illegal and may result in criminal prosecution. Always obtain proper authorization and follow rules of engagement before conducting any password testing activities.

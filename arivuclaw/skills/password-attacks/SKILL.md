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
          enum: [cupp, cewl, crunch]
          description: Wordlist generation tool to use
        options:
          type: object
          description: Tool-specific options and parameters
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
          description: Target service/protocol
        users:
          type: string
          description: Path to user list file
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
          description: Target service/protocol
        credentialFile:
          type: string
          description: "Path to credential file (user:pass format)"
        threads:
          type: number
          description: Number of parallel threads
      required:
        - target
        - service
        - credentialFile
  - name: hash_identify
    description: Identify the hash type from a hash string
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
          enum: [md5, sha1, sha256, sha512, ntlm, bcrypt, argon2]
          description: Hashing algorithm to use
      required:
        - plaintext
triggers:
  - type: keyword
    pattern: "password attack"
    priority: 8
  - type: keyword
    pattern: "wordlist"
    priority: 7
  - type: keyword
    pattern: "credential"
    priority: 5
  - type: keyword
    pattern: "spray"
    priority: 7
environment:
  binaries: []
---

# Password Attacks Toolkit

This skill provides a comprehensive password attack toolkit for wordlist generation, password spraying, credential stuffing, and hash identification/generation.

## Usage

- **wordlist_generate** — Generate custom wordlists using CUPP (profile-based), CeWL (web scraping), or crunch (pattern-based).
- **password_spray** — Spray a single password across many user accounts with configurable delay.
- **credential_check** — Test credential pairs against a target service.
- **hash_identify** — Identify the algorithm of an unknown hash string.
- **hash_generate** — Generate hashes in various algorithms for testing.

## Instructions

1. Use `wordlist_generate` to create targeted wordlists based on target intelligence.
2. Use `password_spray` with appropriate delays to avoid account lockout policies.
3. Use `credential_check` to validate leaked or discovered credential pairs.
4. Use `hash_identify` and `hash_generate` for hash analysis during engagements.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the system owner before running any password attack operations. Unauthorized use of this tool against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

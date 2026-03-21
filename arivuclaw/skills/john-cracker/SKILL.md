---
name: john-cracker
version: "1.0.0"
description: "John the Ripper password cracker. Hash cracking, wordlist attacks, rule-based attacks, format detection."
author: Arivumaiyam AI
tags:
  - john
  - password
  - crack
  - hash
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - unrestricted
tools:
  - name: john_crack
    description: Crack password hashes using John the Ripper
    inputSchema:
      type: object
      properties:
        hashFile:
          type: string
          description: Path to the file containing password hashes
        wordlist:
          type: string
          description: Path to the wordlist file
        rules:
          type: string
          description: Rule set to apply for word mangling
        format:
          type: string
          description: Hash format to use (e.g., raw-md5, sha256crypt, ntlm)
        incremental:
          type: boolean
          description: Enable incremental (brute-force) mode
        session:
          type: string
          description: Session name for saving/restoring progress
      required:
        - hashFile
  - name: john_show
    description: Show cracked passwords from a hash file
    inputSchema:
      type: object
      properties:
        hashFile:
          type: string
          description: Path to the file containing password hashes
        format:
          type: string
          description: Hash format to use
      required:
        - hashFile
  - name: john_identify
    description: Identify the format of a given hash
    inputSchema:
      type: object
      properties:
        hash:
          type: string
          description: The hash string to identify
      required:
        - hash
  - name: john_restore
    description: Restore a previous cracking session
    inputSchema:
      type: object
      properties:
        session:
          type: string
          description: Name of the session to restore
      required:
        - session
triggers:
  - type: keyword
    pattern: "john"
    priority: 7
  - type: keyword
    pattern: "crack password"
    priority: 8
  - type: keyword
    pattern: "hash crack"
    priority: 8
environment:
  binaries:
    - john
---

# John the Ripper Password Cracker

This skill provides an interface to John the Ripper, a powerful password cracking tool capable of hash cracking, wordlist attacks, rule-based attacks, and automatic hash format detection.

## Usage

- **john_crack** — Crack password hashes using wordlist, rules, or incremental mode.
- **john_show** — Display previously cracked passwords for a given hash file.
- **john_identify** — Identify the hash format of an unknown hash string.
- **john_restore** — Resume a previously interrupted cracking session.

## Instructions

1. Provide a valid hash file as input for cracking operations.
2. Optionally specify a wordlist, rule set, or enable incremental mode for different attack strategies.
3. Use session names to save and restore long-running cracking jobs.
4. Use `john_show` to retrieve results after cracking completes.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the system owner before running any password cracking operations. Unauthorized use of this tool against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

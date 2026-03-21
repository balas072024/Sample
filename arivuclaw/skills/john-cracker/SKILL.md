---
name: john-cracker
version: "1.0.0"
description: "John the Ripper password cracker. Hash cracking, wordlist attacks, rule-based attacks, format detection."
author: ArivuClaw
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
          description: Rule set to apply for mangling passwords
        format:
          type: string
          description: Hash format to use (e.g., raw-md5, bcrypt, ntlm)
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
          description: Hash format used
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
          description: Session name to restore
      required:
        - session
triggers:
  - type: keyword
    value: "john"
    priority: 7
  - type: keyword
    value: "crack password"
    priority: 8
  - type: keyword
    value: "hash crack"
    priority: 8
environment:
  binaries:
    - john
---

# John the Ripper Password Cracker

This skill provides an interface to John the Ripper, a widely used open-source password security auditing and recovery tool. It supports hundreds of hash and cipher types, including Unix flavors, Windows LM/NTLM, Kerberos, and database hashes.

## Capabilities

- **Hash Cracking**: Crack password hashes using wordlist, rule-based, or incremental attacks.
- **Format Detection**: Automatically identify or manually specify hash formats.
- **Session Management**: Save and restore cracking sessions for long-running attacks.
- **Rule-Based Attacks**: Apply word mangling rules to expand wordlist coverage.

## Usage

1. Use `john_identify` to determine the hash format.
2. Use `john_crack` with a wordlist and optional rules to crack hashes.
3. Use `john_show` to display cracked passwords.
4. Use `john_restore` to resume an interrupted session.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against systems and credentials you have explicit written permission to test. Unauthorized password cracking is illegal and unethical. Always obtain proper authorization before conducting any password auditing activities.

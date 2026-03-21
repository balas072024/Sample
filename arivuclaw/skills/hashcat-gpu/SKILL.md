---
name: hashcat-gpu
version: "1.0.0"
description: "GPU-accelerated password cracking with Hashcat. World's fastest password recovery."
author: ArivuClaw
tags:
  - hashcat
  - gpu
  - password
  - crack
  - hash
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - unrestricted
tools:
  - name: hashcat_crack
    description: Run a Hashcat attack against password hashes
    inputSchema:
      type: object
      properties:
        hashFile:
          type: string
          description: Path to the file containing password hashes
        hashType:
          type: number
          description: "Hashcat hash type code (e.g., 0=MD5, 1000=NTLM, 2500=WPA)"
        attackMode:
          type: number
          enum: [0, 1, 3, 6, 7]
          description: "Attack mode: 0=dictionary, 1=combinator, 3=bruteforce, 6=hybrid wordlist+mask, 7=hybrid mask+wordlist"
        wordlist:
          type: string
          description: Path to the wordlist file
        mask:
          type: string
          description: Mask pattern for brute-force or hybrid attacks
        rules:
          type: string
          description: Path to the rules file
        device:
          type: string
          description: Device to use for cracking (e.g., GPU ID)
        workload:
          type: number
          enum: [1, 2, 3, 4]
          description: "Workload profile: 1=low, 2=default, 3=high, 4=nightmare"
      required:
        - hashFile
        - hashType
  - name: hashcat_benchmark
    description: Benchmark hash cracking speed on available hardware
    inputSchema:
      type: object
      properties:
        hashType:
          type: number
          description: Specific hash type to benchmark (omit for all)
  - name: hashcat_identify
    description: Identify the type of a given hash
    inputSchema:
      type: object
      properties:
        hash:
          type: string
          description: The hash string to identify
      required:
        - hash
  - name: hashcat_show
    description: Show cracked results from a previous session
    inputSchema:
      type: object
      properties:
        hashFile:
          type: string
          description: Path to the file containing password hashes
        hashType:
          type: number
          description: Hashcat hash type code
      required:
        - hashFile
        - hashType
  - name: hashcat_restore
    description: Restore a previous Hashcat session
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
    value: "hashcat"
    priority: 9
  - type: keyword
    value: "gpu crack"
    priority: 8
environment:
  binaries:
    - hashcat
---

# Hashcat GPU-Accelerated Password Cracker

This skill provides an interface to Hashcat, the world's fastest and most advanced password recovery utility. It leverages GPU acceleration to achieve extremely high cracking speeds across over 300 hash types.

## Capabilities

- **GPU-Accelerated Cracking**: Leverage NVIDIA and AMD GPUs for maximum performance.
- **Multiple Attack Modes**: Dictionary, combinator, brute-force, and hybrid attacks.
- **Hash Identification**: Identify unknown hash types automatically.
- **Benchmarking**: Measure cracking speed on available hardware.
- **Session Management**: Save and restore long-running cracking sessions.

## Usage

1. Use `hashcat_identify` to determine the hash type code.
2. Use `hashcat_crack` with the appropriate hash type and attack mode.
3. Use `hashcat_show` to display cracked passwords.
4. Use `hashcat_benchmark` to test hardware performance.
5. Use `hashcat_restore` to resume an interrupted session.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against systems and credentials you have explicit written permission to test. Unauthorized password cracking is illegal and unethical. Always obtain proper authorization before conducting any password auditing activities.

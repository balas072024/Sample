---
name: hashcat-gpu
version: "1.0.0"
description: "GPU-accelerated password cracking with Hashcat. World's fastest password recovery."
author: Arivumaiyam AI
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
          description: Hashcat hash type code (e.g., 0 for MD5, 1000 for NTLM)
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
          description: Path to a rules file
        device:
          type: string
          description: Device(s) to use for cracking
        workload:
          type: number
          enum: [1, 2, 3, 4]
          description: "Workload profile: 1=low, 2=default, 3=high, 4=nightmare"
      required:
        - hashFile
        - hashType
  - name: hashcat_benchmark
    description: Benchmark hash cracking speed on available devices
    inputSchema:
      type: object
      properties:
        hashType:
          type: number
          description: Specific hash type to benchmark (omit for all types)
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
    description: Show cracked results from a previous Hashcat run
    inputSchema:
      type: object
      properties:
        hashFile:
          type: string
          description: Path to the hash file
        hashType:
          type: number
          description: Hashcat hash type code
      required:
        - hashFile
        - hashType
  - name: hashcat_restore
    description: Restore a previously saved Hashcat session
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
    pattern: "hashcat"
    priority: 9
  - type: keyword
    pattern: "gpu crack"
    priority: 8
environment:
  binaries:
    - hashcat
---

# Hashcat GPU-Accelerated Password Cracker

This skill provides an interface to Hashcat, the world's fastest password recovery tool leveraging GPU acceleration for high-speed hash cracking.

## Usage

- **hashcat_crack** — Run dictionary, combinator, brute-force, or hybrid attacks against hash files.
- **hashcat_benchmark** — Benchmark cracking speed for specific or all hash types.
- **hashcat_identify** — Identify an unknown hash type.
- **hashcat_show** — Display previously cracked results.
- **hashcat_restore** — Resume a previously interrupted session.

## Instructions

1. Provide the hash file and the corresponding hash type code for cracking operations.
2. Select the appropriate attack mode: dictionary (0), combinator (1), brute-force (3), or hybrid (6/7).
3. Optionally specify wordlists, masks, rules, devices, and workload profiles.
4. Use session names for long-running jobs so they can be restored if interrupted.
5. Run benchmarks to evaluate hardware performance before launching large-scale attacks.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the system owner before running any password cracking operations. Unauthorized use of this tool against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

---
name: volatility-mem
version: "1.0.0"
description: "Volatility memory forensics — analyze RAM dumps for processes, network connections, malware, credentials."
author: Arivumaiyam AI
tags:
  - volatility
  - memory
  - ram
  - forensics
  - malware
permissions:
  - system.process
  - filesystem.read
  - code.execute
  - unrestricted
environment:
  binaries:
    - vol.py
tools:
  - name: vol_info
    description: Get memory image info (OS, profile)
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
      required: [image]
  - name: vol_pslist
    description: List running processes
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile (e.g., Win7SP1x64)
      required: [image]
  - name: vol_netscan
    description: List network connections
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
      required: [image]
  - name: vol_filescan
    description: Scan for file objects in memory
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
        filter:
          type: string
          description: Filter string for file names
      required: [image]
  - name: vol_dumpfiles
    description: Dump files from memory
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
        pid:
          type: number
          description: Process ID to dump files from
        outputDir:
          type: string
          description: Output directory for dumped files
      required: [image, outputDir]
  - name: vol_malfind
    description: Find injected/hidden code
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
        pid:
          type: number
          description: Specific process ID to analyze
      required: [image]
  - name: vol_hashdump
    description: Dump password hashes from memory
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
      required: [image]
  - name: vol_cmdline
    description: Show process command lines
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to memory dump file
        profile:
          type: string
          description: Volatility profile
      required: [image]
triggers:
  - type: keyword
    pattern: volatility
    priority: 9
  - type: keyword
    pattern: memory forensics
    priority: 8
  - type: keyword
    pattern: ram analysis
    priority: 7
---

# Volatility Memory Forensics

This skill provides memory forensics analysis using the Volatility framework to examine RAM dumps for running processes, network connections, malware artifacts, and credentials.

## Capabilities

- **Image Info**: Identify the operating system and appropriate Volatility profile for a memory dump.
- **Process Listing**: Enumerate all running processes at the time of memory capture.
- **Network Scanning**: Identify active and closed network connections, listening ports, and associated processes.
- **File Scanning**: Locate file objects in memory, including open files and recently accessed documents.
- **File Dumping**: Extract files from memory for further analysis.
- **Malware Detection**: Use malfind to detect injected code, hollowed processes, and suspicious memory regions.
- **Hash Dumping**: Extract Windows password hashes (SAM) from memory.
- **Command Lines**: Recover the command-line arguments of all running processes.

## Usage

1. Start with `vol_info` to identify the OS profile for the memory dump.
2. Use `vol_pslist` and `vol_cmdline` to enumerate processes and their arguments.
3. Check `vol_netscan` for network activity.
4. Run `vol_malfind` to detect injected or hidden code.
5. Extract evidence with `vol_dumpfiles` and credentials with `vol_hashdump`.

## Requirements

- Volatility 2 or 3 installed (`vol.py` in PATH)
- Memory dump file (raw, lime, crashdump, etc.)
- Sufficient disk space for extracted artifacts

## Authorized Use Only

This skill is intended exclusively for authorized digital forensics investigations and incident response. Always follow proper chain-of-custody procedures and obtain appropriate legal authorization before analyzing memory dumps. Unauthorized access to or analysis of systems and data you do not own or have legal permission to examine is illegal and unethical.

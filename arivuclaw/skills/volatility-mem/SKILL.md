---
name: volatility-mem
version: "1.0.0"
description: "Volatility memory forensics \u2014 analyze RAM dumps for processes, network connections, malware, credentials."
author: ArivuClaw
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
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
  - name: vol_pslist
    description: List running processes
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile (e.g. Win7SP1x64)
  - name: vol_netscan
    description: List network connections
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
  - name: vol_filescan
    description: Scan for file objects in memory
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
        filter:
          type: string
          description: Filter string for file names
  - name: vol_dumpfiles
    description: Dump files from memory
    inputSchema:
      type: object
      required:
        - image
        - outputDir
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
        pid:
          type: number
          description: Process ID to dump files from
        outputDir:
          type: string
          description: Output directory for dumped files
  - name: vol_malfind
    description: Find injected/hidden code
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
        pid:
          type: number
          description: Specific process ID to analyze
  - name: vol_hashdump
    description: Dump password hashes from memory
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
  - name: vol_cmdline
    description: Show process command lines
    inputSchema:
      type: object
      required:
        - image
      properties:
        image:
          type: string
          description: Path to the memory dump file
        profile:
          type: string
          description: Volatility profile
triggers:
  - type: keyword
    value: volatility
    priority: 9
  - type: keyword
    value: memory forensics
    priority: 8
  - type: keyword
    value: ram analysis
    priority: 7
---

# Volatility Memory Forensics

This skill provides memory forensics capabilities using the Volatility framework. It enables analysis of RAM dumps to extract processes, network connections, files, malware indicators, and credentials from memory images.

## Capabilities

- **Image Info**: Identify the operating system and appropriate Volatility profile for a memory dump.
- **Process Listing**: Enumerate running processes at the time of memory capture.
- **Network Scanning**: Extract active and closed network connections and listening ports.
- **File Scanning**: Scan memory for file object references and filter by name patterns.
- **File Dumping**: Extract files from memory by process ID to an output directory.
- **Malware Detection**: Use malfind to detect injected code, hollowed processes, and hidden malware in memory.
- **Hash Dumping**: Extract password hashes from the SAM and SYSTEM registry hives in memory.
- **Command Lines**: Recover process command-line arguments for forensic reconstruction.

## Usage

1. Start with `vol_info` to identify the memory image profile.
2. Use `vol_pslist` and `vol_cmdline` to enumerate processes and their arguments.
3. Check `vol_netscan` for network activity indicators.
4. Run `vol_malfind` to detect injected or hidden malicious code.
5. Dump relevant files with `vol_dumpfiles` for further analysis.
6. Extract credentials with `vol_hashdump` if needed.

## Authorization Notice

This skill is intended for **authorized digital forensics investigations and incident response only**. You must have proper legal authority or organizational authorization before analyzing memory dumps. Memory images may contain sensitive data including credentials, personal information, and proprietary data. Handle all evidence in accordance with chain of custody procedures and applicable data protection regulations.

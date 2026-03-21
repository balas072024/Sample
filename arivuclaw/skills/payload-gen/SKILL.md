---
name: payload-gen
version: "1.0.0"
description: "Generate payloads and shellcode using msfvenom, and custom payload creation for authorized testing."
author: Arivumaiyam AI
tags:
  - msfvenom
  - payload
  - shellcode
  - encode
permissions:
  - system.process
  - code.execute
  - filesystem.write
  - unrestricted
tools:
  - name: msfvenom_generate
    description: Generate a payload.
    inputSchema:
      type: object
      required:
        - payload
        - output
      properties:
        payload:
          type: string
          description: Payload name (e.g. windows/meterpreter/reverse_tcp).
        lhost:
          type: string
          description: Local host for the payload callback.
        lport:
          type: number
          description: Local port for the payload callback.
        format:
          type: string
          enum:
            - exe
            - elf
            - dll
            - apk
            - py
            - ps1
            - raw
            - c
            - bash
            - war
            - asp
            - jsp
          description: Output format.
        encoder:
          type: string
          description: Encoder to use (e.g. x86/shikata_ga_nai).
        iterations:
          type: number
          description: Number of encoding iterations.
        platform:
          type: string
          enum:
            - windows
            - linux
            - osx
            - android
          description: Target platform.
        arch:
          type: string
          enum:
            - x86
            - x64
            - arm
          description: Target architecture.
        output:
          type: string
          description: Output file path.
  - name: msfvenom_list
    description: List available payloads, encoders, or formats.
    inputSchema:
      type: object
      properties:
        type:
          type: string
          enum:
            - payloads
            - encoders
            - formats
            - platforms
            - archs
          description: Type of items to list.
        filter:
          type: string
          description: Filter string to narrow results.
  - name: payload_obfuscate
    description: Obfuscate a payload.
    inputSchema:
      type: object
      required:
        - inputPath
        - outputPath
      properties:
        inputPath:
          type: string
          description: Path to the payload file to obfuscate.
        method:
          type: string
          enum:
            - xor
            - aes
            - base64
            - custom
          description: Obfuscation method.
        key:
          type: string
          description: Encryption key for xor or aes methods.
        outputPath:
          type: string
          description: Output file path for the obfuscated payload.
triggers:
  - type: keyword
    value: msfvenom
    priority: 9
  - type: keyword
    value: payload
    priority: 6
  - type: keyword
    value: shellcode
    priority: 8
environment:
  binaries:
    - msfvenom
---

# Payload Gen

This skill provides payload generation and obfuscation capabilities using msfvenom and custom techniques for authorized penetration testing engagements.

## Capabilities

- **msfvenom_generate** — Generate payloads for multiple platforms and architectures in various output formats with optional encoding.
- **msfvenom_list** — List available payloads, encoders, formats, platforms, and architectures supported by msfvenom.
- **payload_obfuscate** — Obfuscate generated payloads using XOR, AES, Base64, or custom methods to test detection capabilities.

## Instructions

1. Use `msfvenom_list` to explore available payloads and encoders for your target platform.
2. Generate payloads with `msfvenom_generate`, specifying the appropriate platform, architecture, and format.
3. Optionally obfuscate payloads with `payload_obfuscate` to test antivirus and EDR evasion capabilities.
4. Always verify that generated payloads are used only against authorized targets.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

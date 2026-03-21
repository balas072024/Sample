---
name: steganography
version: "1.0.0"
description: Hide and extract data within images, audio, and files. Steghide, zsteg, binwalk, stegsolve.
author: ArivuClaw
tags: [steganography, stego, hidden, data, ctf]
permissions: [system.process, filesystem.read, filesystem.write, code.execute]
tools:
  - name: steg_hide
    description: Hide data inside a carrier file
    permissions: [filesystem.read, filesystem.write, code.execute]
    inputSchema:
      type: object
      properties:
        carrierFile: { type: string }
        dataFile: { type: string }
        password: { type: string }
        outputFile: { type: string }
        tool: { type: string, enum: [steghide, openstego] }
      required: [carrierFile, dataFile, outputFile]
  - name: steg_extract
    description: Extract hidden data from a file
    permissions: [filesystem.read, filesystem.write, code.execute]
    inputSchema:
      type: object
      properties:
        file: { type: string }
        password: { type: string }
        outputDir: { type: string }
        tool: { type: string, enum: [steghide, zsteg, binwalk, stegsolve] }
      required: [file, outputDir]
  - name: steg_analyze
    description: Analyze a file for hidden content
    permissions: [filesystem.read, code.execute]
    inputSchema:
      type: object
      properties:
        file: { type: string }
        tool: { type: string, enum: [zsteg, binwalk, stegsolve, exiftool, strings] }
      required: [file]
  - name: steg_lsb
    description: LSB (Least Significant Bit) analysis on images
    permissions: [filesystem.read, code.execute]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        bits: { type: number }
        channel: { type: string, enum: [r, g, b, a, all] }
      required: [image]
triggers:
  - type: keyword
    pattern: steganography
    priority: 9
  - type: keyword
    pattern: stego
    priority: 8
  - type: keyword
    pattern: steghide
    priority: 9
  - type: keyword
    pattern: hidden data
    priority: 7
---

# Steganography Skill

Hide and extract data within images, audio, and files. For CTF challenges and authorized security testing.

## Tools
- `steghide` — Hide/extract data in JPEG, BMP, WAV, AU files
- `zsteg` — Detect steganography in PNG and BMP
- `binwalk` — Firmware and file analysis, embedded file extraction
- `stegsolve` — Image analysis with various filters and bit planes

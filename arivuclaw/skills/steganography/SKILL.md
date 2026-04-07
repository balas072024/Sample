---
name: steganography
version: "1.0.0"
description: Hide and extract data within images, audio, and files. Steghide, zsteg, binwalk, stegsolve.
author: ArivuClaw
tags:
  - steganography
  - stego
  - hidden
  - data
  - ctf
permissions:
  - system.process
  - filesystem.read
  - filesystem.write
  - code.execute
tools:
  - name: steg_hide
    description: Hide data inside a carrier file
    inputSchema:
      type: object
      properties:
        carrierFile:
          type: string
          description: Path to the carrier file (image/audio)
        dataFile:
          type: string
          description: Path to the file to hide
        password:
          type: string
          description: Password to protect the hidden data
        outputFile:
          type: string
          description: Path for the output stego file
        tool:
          type: string
          enum: [steghide, openstego]
          description: Steganography tool to use
      required: [carrierFile, dataFile, outputFile]
  - name: steg_extract
    description: Extract hidden data from a file
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the stego file to analyze
        password:
          type: string
          description: Password for extraction
        outputDir:
          type: string
          description: Output directory for extracted data
        tool:
          type: string
          enum: [steghide, zsteg, binwalk, stegsolve]
          description: Extraction tool to use
      required: [file, outputDir]
  - name: steg_analyze
    description: Analyze a file for hidden content
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the file to analyze
        tool:
          type: string
          enum: [zsteg, binwalk, stegsolve, exiftool, strings]
          description: Analysis tool to use
      required: [file]
  - name: steg_lsb
    description: LSB (Least Significant Bit) analysis
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to the image file
        bits:
          type: number
          description: Number of least significant bits to analyze
        channel:
          type: string
          enum: [r, g, b, a, all]
          description: Color channel to analyze
      required: [image]
triggers:
  - type: keyword
    pattern: steganography
    priority: 9
  - type: keyword
    pattern: stego
    priority: 8
  - type: keyword
    pattern: hidden data
    priority: 7
  - type: keyword
    pattern: steghide
    priority: 9
---

# Steganography — Hide and Extract Data

This skill provides steganography capabilities for hiding data within carrier files and extracting hidden data from images, audio, and other files.

## Capabilities

- **Data Hiding**: Embed secret data inside carrier files (images, audio) using Steghide or OpenStego with optional password protection.
- **Data Extraction**: Extract hidden data from stego files using Steghide, zsteg, Binwalk, or Stegsolve.
- **Stego Analysis**: Analyze files for indicators of hidden content using multiple detection tools.
- **LSB Analysis**: Perform Least Significant Bit analysis on images across individual or all color channels to detect or extract hidden data.

## Usage

1. To hide data, use `steg_hide` with a carrier file and the data to embed.
2. To extract, use `steg_extract` with the stego file and the appropriate tool.
3. For detection, run `steg_analyze` with different tools to identify hidden content.
4. For detailed image analysis, use `steg_lsb` to examine specific bit planes and color channels.

## Requirements

- Steghide for JPEG/BMP/WAV/AU embedding and extraction
- zsteg for PNG/BMP LSB analysis
- Binwalk for embedded file detection
- Stegsolve for visual image analysis
- ExifTool for metadata inspection

## Authorized Use Only

This skill is intended exclusively for authorized security testing, CTF competitions, and forensic investigations. Always ensure you have proper authorization before hiding data in or extracting data from files that belong to others. Unauthorized use of steganography techniques for malicious purposes is illegal and unethical.

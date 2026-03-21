---
name: forensics-tools
version: "1.0.0"
description: "Digital forensics toolkit \u2014 disk imaging, file recovery, timeline analysis, evidence collection."
author: ArivuClaw
tags:
  - forensics
  - disk
  - evidence
  - recovery
  - timeline
permissions:
  - system.process
  - system.admin
  - filesystem.read
  - filesystem.write
  - code.execute
  - unrestricted
tools:
  - name: disk_image
    description: Create a forensic disk image
    inputSchema:
      type: object
      required:
        - source
        - destination
      properties:
        source:
          type: string
          description: Source device or file path
        destination:
          type: string
          description: Destination path for the disk image
        format:
          type: string
          enum:
            - dd
            - ewf
            - aff
          description: Disk image format
        hash:
          type: boolean
          description: Compute hash during imaging for integrity verification
        compress:
          type: boolean
          description: Enable compression on the output image
  - name: file_recover
    description: Recover deleted files
    inputSchema:
      type: object
      required:
        - image
        - outputDir
      properties:
        image:
          type: string
          description: Path to the disk image
        outputDir:
          type: string
          description: Output directory for recovered files
        types:
          type: array
          items:
            type: string
          description: "File types to recover (e.g. [\"jpg\", \"pdf\", \"doc\"])"
  - name: file_carve
    description: Carve files from raw disk/memory
    inputSchema:
      type: object
      required:
        - input
        - outputDir
      properties:
        input:
          type: string
          description: Input file (disk image or memory dump)
        outputDir:
          type: string
          description: Output directory for carved files
        tool:
          type: string
          enum:
            - foremost
            - scalpel
            - photorec
          description: File carving tool to use
  - name: timeline_create
    description: Create a forensic timeline
    inputSchema:
      type: object
      required:
        - image
        - outputFile
      properties:
        image:
          type: string
          description: Path to the disk image
        outputFile:
          type: string
          description: Output file for the timeline
        tool:
          type: string
          enum:
            - log2timeline
            - plaso
            - mactime
          description: Timeline creation tool to use
  - name: hash_verify
    description: Verify file/image integrity
    inputSchema:
      type: object
      required:
        - file
      properties:
        file:
          type: string
          description: Path to the file or image to verify
        algorithm:
          type: string
          enum:
            - md5
            - sha1
            - sha256
          description: Hashing algorithm to use
        expectedHash:
          type: string
          description: Expected hash value for comparison
  - name: metadata_extract
    description: Extract metadata from files
    inputSchema:
      type: object
      required:
        - file
      properties:
        file:
          type: string
          description: Path to the file to analyze
        tool:
          type: string
          enum:
            - exiftool
            - strings
            - binwalk
          description: Metadata extraction tool to use
triggers:
  - type: keyword
    value: forensics
    priority: 8
  - type: keyword
    value: disk image
    priority: 7
  - type: keyword
    value: file recovery
    priority: 7
  - type: keyword
    value: evidence
    priority: 6
---

# Forensics Tools — Digital Forensics Toolkit

This skill provides a comprehensive digital forensics toolkit for disk imaging, file recovery, timeline analysis, and evidence collection. It supports industry-standard tools and formats for forensically sound investigations.

## Capabilities

- **Disk Imaging**: Create forensic disk images in dd, EWF, or AFF formats with optional hashing and compression for chain of custody integrity.
- **File Recovery**: Recover deleted files from disk images by specifying target file types.
- **File Carving**: Carve files from raw disk images or memory dumps using Foremost, Scalpel, or PhotoRec.
- **Timeline Analysis**: Generate forensic timelines using log2timeline/Plaso or mactime for temporal event reconstruction.
- **Hash Verification**: Verify the integrity of forensic images and files using MD5, SHA1, or SHA256 hash comparison.
- **Metadata Extraction**: Extract metadata from files using ExifTool, strings, or Binwalk for embedded data analysis.

## Usage

1. Create a forensic image of the source device using `disk_image` with integrity hashing enabled.
2. Verify the image integrity with `hash_verify`.
3. Recover deleted files with `file_recover` or carve files with `file_carve`.
4. Build a forensic timeline with `timeline_create` for event reconstruction.
5. Extract metadata from recovered files using `metadata_extract`.

## Authorization Notice

This skill is intended for **authorized digital forensics investigations and incident response only**. You must have proper legal authority, such as a warrant, organizational authorization, or consent from the data owner, before performing any forensic imaging, file recovery, or evidence collection. Unauthorized access to or analysis of digital evidence may violate privacy laws and regulations. Always maintain chain of custody and follow forensically sound procedures.

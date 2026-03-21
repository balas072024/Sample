---
name: forensics-tools
version: "1.0.0"
description: "Digital forensics toolkit — disk imaging, file recovery, timeline analysis, evidence collection."
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
      properties:
        source:
          type: string
          description: Source device or file (e.g., /dev/sda)
        destination:
          type: string
          description: Destination path for the image file
        format:
          type: string
          enum: [dd, ewf, aff]
          description: Image format
        hash:
          type: boolean
          description: Calculate verification hash during imaging
        compress:
          type: boolean
          description: Compress the output image
      required: [source, destination]
  - name: file_recover
    description: Recover deleted files
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        outputDir:
          type: string
          description: Output directory for recovered files
        types:
          type: array
          items:
            type: string
          description: "File types to recover (e.g., [\"jpg\", \"pdf\", \"doc\"])"
      required: [image, outputDir]
  - name: file_carve
    description: Carve files from raw disk/memory
    inputSchema:
      type: object
      properties:
        input:
          type: string
          description: Input file (disk image or memory dump)
        outputDir:
          type: string
          description: Output directory for carved files
        tool:
          type: string
          enum: [foremost, scalpel, photorec]
          description: Carving tool to use
      required: [input, outputDir]
  - name: timeline_create
    description: Create a forensic timeline
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        outputFile:
          type: string
          description: Output file for the timeline
        tool:
          type: string
          enum: [log2timeline, plaso, mactime]
          description: Timeline creation tool
      required: [image, outputFile]
  - name: hash_verify
    description: Verify file/image integrity
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to file to verify
        algorithm:
          type: string
          enum: [md5, sha1, sha256]
          description: Hash algorithm to use
        expectedHash:
          type: string
          description: Expected hash value for comparison
      required: [file]
  - name: metadata_extract
    description: Extract metadata from files
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the file to analyze
        tool:
          type: string
          enum: [exiftool, strings, binwalk]
          description: Metadata extraction tool
      required: [file]
triggers:
  - type: keyword
    pattern: forensics
    priority: 8
  - type: keyword
    pattern: disk image
    priority: 7
  - type: keyword
    pattern: file recovery
    priority: 7
  - type: keyword
    pattern: evidence
    priority: 6
---

# Forensics Tools — Digital Forensics Toolkit

This skill provides a comprehensive digital forensics toolkit for disk imaging, file recovery, timeline analysis, and evidence collection.

## Capabilities

- **Disk Imaging**: Create bit-for-bit forensic images in dd, EWF (E01), or AFF formats with optional hashing and compression.
- **File Recovery**: Recover deleted files from disk images by specifying target file types.
- **File Carving**: Carve files from raw disk images or memory dumps using Foremost, Scalpel, or PhotoRec.
- **Timeline Creation**: Build forensic timelines from disk images using log2timeline/Plaso or mactime for temporal analysis.
- **Hash Verification**: Verify integrity of forensic images and evidence files using MD5, SHA-1, or SHA-256.
- **Metadata Extraction**: Extract metadata from files using ExifTool, strings, or Binwalk.

## Usage

1. Create a forensic image of the source media with `disk_image`.
2. Verify the image integrity with `hash_verify`.
3. Recover deleted files with `file_recover` or carve files with `file_carve`.
4. Build a forensic timeline with `timeline_create` for temporal analysis.
5. Extract metadata from individual files with `metadata_extract`.

## Requirements

- dd, ewfacquire (libewf), or afflib for imaging
- Foremost, Scalpel, or PhotoRec for file carving
- log2timeline/Plaso for timeline generation
- ExifTool, Binwalk for metadata extraction
- Sufficient storage for forensic images

## Authorized Use Only

This skill is intended exclusively for authorized digital forensics investigations and incident response. Always follow proper chain-of-custody procedures and obtain appropriate legal authorization before acquiring or analyzing digital evidence. Unauthorized access to or analysis of systems and data you do not own or have legal permission to examine is illegal and unethical.

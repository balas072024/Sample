---
name: autopsy-disk
version: "1.0.0"
description: "Autopsy/Sleuth Kit disk forensics — file system analysis, keyword search, hash filtering, web artifacts."
author: ArivuClaw
tags:
  - autopsy
  - sleuthkit
  - disk
  - forensics
  - filesystem
permissions:
  - system.process
  - filesystem.read
  - code.execute
  - unrestricted
tools:
  - name: autopsy_case
    description: Create/open an Autopsy case
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum: [create, open]
          description: Create a new case or open an existing one
        caseName:
          type: string
          description: Name of the forensic case
        caseDir:
          type: string
          description: Directory for the case files
        dataSource:
          type: string
          description: Path to the disk image or data source
      required: [action]
  - name: tsk_fls
    description: List files and directories in a disk image
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        offset:
          type: number
          description: Partition offset in bytes
        path:
          type: string
          description: Directory path to list
        recursive:
          type: boolean
          description: Recursively list all files
        deleted:
          type: boolean
          description: Show only deleted files
      required: [image]
  - name: tsk_icat
    description: Extract a file by inode from disk image
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        inode:
          type: number
          description: Inode number of the file to extract
        output:
          type: string
          description: Output file path
      required: [image, inode, output]
  - name: tsk_keyword
    description: Keyword search across disk image
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        keyword:
          type: string
          description: Keyword or pattern to search for
        regex:
          type: boolean
          description: Treat keyword as a regular expression
      required: [image, keyword]
  - name: tsk_timeline
    description: Create MAC timeline from disk image
    inputSchema:
      type: object
      properties:
        image:
          type: string
          description: Path to disk image file
        output:
          type: string
          description: Output file for the timeline
        bodyFile:
          type: boolean
          description: Generate intermediate body file
      required: [image, output]
triggers:
  - type: keyword
    pattern: autopsy
    priority: 9
  - type: keyword
    pattern: sleuthkit
    priority: 9
  - type: keyword
    pattern: disk forensics
    priority: 7
---

# Autopsy/Sleuth Kit — Disk Forensics

This skill provides disk forensics capabilities using Autopsy and The Sleuth Kit (TSK) for file system analysis, keyword searching, file extraction, and timeline generation.

## Capabilities

- **Case Management**: Create and open Autopsy forensic cases with associated data sources.
- **File Listing (fls)**: List files and directories within a disk image, including deleted entries, with optional recursive traversal.
- **File Extraction (icat)**: Extract individual files by inode number from a disk image for analysis.
- **Keyword Search**: Search across an entire disk image for keywords or regular expression patterns.
- **MAC Timeline**: Generate Modified/Accessed/Changed (MAC) timelines from disk images for temporal analysis of file system activity.

## Usage

1. Create an Autopsy case with `autopsy_case` to organize your investigation.
2. Use `tsk_fls` to browse the file system and identify files of interest, including deleted files.
3. Extract specific files with `tsk_icat` using their inode numbers.
4. Run `tsk_keyword` to search for evidence-related terms across the entire image.
5. Generate a MAC timeline with `tsk_timeline` to understand the sequence of events.

## Requirements

- Autopsy and/or The Sleuth Kit installed
- Disk image file (dd, E01, AFF, etc.)
- Sufficient disk space for case data and extracted files

## Authorized Use Only

This skill is intended exclusively for authorized digital forensics investigations and incident response. Always follow proper chain-of-custody procedures and obtain appropriate legal authorization before examining disk images or extracting data. Unauthorized access to or analysis of systems and data you do not own or have legal permission to examine is illegal and unethical.

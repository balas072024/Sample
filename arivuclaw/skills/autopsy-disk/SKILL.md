---
name: autopsy-disk
version: "1.0.0"
description: Autopsy/Sleuth Kit disk forensics — file system analysis, keyword search, hash filtering, web artifacts.
author: ArivuClaw
tags: [autopsy, sleuthkit, disk, forensics, filesystem]
permissions: [system.process, filesystem.read, code.execute, unrestricted]
tools:
  - name: autopsy_case
    description: Create or open an Autopsy case
    permissions: [system.process, filesystem.read]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [create, open] }
        caseName: { type: string }
        caseDir: { type: string }
        dataSource: { type: string }
      required: [action]
  - name: tsk_fls
    description: List files and directories in a disk image
    permissions: [system.process, filesystem.read]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        offset: { type: number }
        path: { type: string }
        recursive: { type: boolean }
        deleted: { type: boolean }
      required: [image]
  - name: tsk_icat
    description: Extract a file by inode from disk image
    permissions: [system.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        inode: { type: number }
        output: { type: string }
      required: [image, inode, output]
  - name: tsk_keyword
    description: Keyword search across disk image
    permissions: [system.process, filesystem.read]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        keyword: { type: string }
        regex: { type: boolean }
      required: [image, keyword]
  - name: tsk_timeline
    description: Create MAC timeline from disk image
    permissions: [system.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        output: { type: string }
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

# Autopsy / Sleuth Kit Disk Forensics

File system analysis, deleted file recovery, keyword search, and timeline creation from disk images. For authorized forensic investigations.

---
name: zip-archive
version: 1.0.0
description: Compresses and extracts archives in multiple formats including zip, tar, gzip, and 7z.
author: ArivuClaw
tags:
  - utility
  - archive
  - compression
  - files
permissions:
  - read_files
  - write_files
  - execute_commands
tools:
  - name: compress
    description: Creates a compressed archive from files or directories.
    permissions:
      - read_files
      - write_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        source:
          type: array
          items:
            type: string
          description: List of file or directory paths to compress.
        output_path:
          type: string
          description: Path for the output archive file.
        format:
          type: string
          enum: [zip, tar, tar.gz, tar.bz2, 7z]
          description: Archive format to create.
          default: zip
        compression_level:
          type: integer
          minimum: 1
          maximum: 9
          description: Compression level (1=fastest, 9=smallest).
          default: 6
        exclude:
          type: array
          items:
            type: string
          description: Glob patterns of files to exclude.
      required:
        - source
        - output_path
  - name: extract
    description: Extracts contents from a compressed archive.
    permissions:
      - read_files
      - write_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        archive_path:
          type: string
          description: Path to the archive file.
        output_dir:
          type: string
          description: Directory to extract contents to.
        files:
          type: array
          items:
            type: string
          description: Specific files to extract. Extracts all if omitted.
      required:
        - archive_path
  - name: list_contents
    description: Lists the contents of an archive without extracting.
    permissions:
      - read_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        archive_path:
          type: string
          description: Path to the archive file.
      required:
        - archive_path
triggers:
  - pattern: "compress {path}"
  - pattern: "extract {archive}"
  - pattern: "zip {files}"
  - pattern: "unzip {archive}"
  - pattern: "list contents of {archive}"
---

# Zip Archive

Compresses and extracts archives in multiple formats including zip, tar, gzip, bzip2, and 7z.

## Usage

```
compress src/ dist/
extract backup.tar.gz
zip project/build
unzip release-v2.zip
list contents of data.7z
```

## Features

- Multi-format support: zip, tar, tar.gz, tar.bz2, 7z
- Configurable compression levels (1-9)
- Selective extraction of specific files
- Exclusion patterns for compression
- Archive content listing without extraction

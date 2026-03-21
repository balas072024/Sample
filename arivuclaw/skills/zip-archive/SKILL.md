---
name: zip-archive
version: "1.0.0"
description: Archive management for creating, extracting, and listing contents of zip, tar, gzip, and 7z archives.
author: Arivumaiyam AI
tags: [archive, zip, tar, gzip, compression, extract]
permissions: [filesystem.read, filesystem.write]
tools:
  - name: archive_create
    description: Create a new archive from files or directories
    permissions: [filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        output_path: { type: string, description: "Path for the output archive file" }
        sources: { type: array, items: { type: string }, description: "File or directory paths to include" }
        format: { type: string, enum: [zip, tar, tar.gz, tar.bz2, 7z], description: "Archive format to create" }
        compression_level: { type: number, description: "Compression level from 0 (none) to 9 (maximum)" }
        exclude: { type: array, items: { type: string }, description: "Glob patterns for files to exclude" }
      required: [output_path, sources, format]
  - name: archive_extract
    description: Extract files from an archive
    permissions: [filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        archive_path: { type: string, description: "Path to the archive file" }
        output_dir: { type: string, description: "Directory to extract files into" }
        files: { type: array, items: { type: string }, description: "Specific files to extract (extracts all if empty)" }
        overwrite: { type: boolean, description: "Whether to overwrite existing files" }
        password: { type: string, description: "Password for encrypted archives" }
      required: [archive_path, output_dir]
  - name: archive_list
    description: List the contents of an archive without extracting
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        archive_path: { type: string, description: "Path to the archive file" }
        verbose: { type: boolean, description: "Whether to show detailed file information (size, date, permissions)" }
        filter: { type: string, description: "Glob pattern to filter listed entries" }
      required: [archive_path]
triggers:
  - type: keyword
    pattern: "zip|archive|compress|extract|unzip|tar|gzip|7z"
    priority: 6
---

# Zip Archive

You are an archive management assistant.

Help the user create, extract, and inspect archive files in various formats. When creating archives, suggest appropriate formats and compression levels based on the content type. For extraction, verify the output directory exists and warn about potential overwrites. When listing contents, present the information in a clear format showing file names, sizes, and dates. Handle encrypted archives by prompting for passwords securely. Report total archive size and compression ratio after creation.

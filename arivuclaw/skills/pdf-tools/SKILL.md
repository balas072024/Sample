---
name: pdf-tools
version: "1.0.0"
description: Create, read, merge, split, and convert PDFs.
author: Arivumaiyam AI
tags:
  - pdf
  - document
  - convert
permissions:
  - pdf.process
  - filesystem.read
  - filesystem.write
tools:
  - name: pdf_read
    description: Extract text from a PDF file
    permissions: [pdf.process, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        pages: { type: string, description: "Page range (e.g. '1-5', 'all')" }
      required: [path]
  - name: pdf_create
    description: Create a PDF from text or markdown
    permissions: [pdf.process, filesystem.write]
    inputSchema:
      type: object
      properties:
        content: { type: string }
        outputPath: { type: string }
        format: { type: string, enum: [text, markdown, html] }
      required: [content, outputPath]
  - name: pdf_merge
    description: Merge multiple PDFs into one
    permissions: [pdf.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        files: { type: array, items: { type: string } }
        outputPath: { type: string }
      required: [files, outputPath]
  - name: pdf_split
    description: Split a PDF into separate files by page ranges
    permissions: [pdf.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        ranges: { type: array, items: { type: string }, description: "Page ranges like ['1-3', '4-6']" }
        outputDir: { type: string }
      required: [path, ranges, outputDir]
  - name: pdf_to_image
    description: Convert PDF pages to images
    permissions: [pdf.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        outputDir: { type: string }
        format: { type: string, enum: [png, jpg] }
        dpi: { type: number }
      required: [path, outputDir]
triggers:
  - type: keyword
    pattern: pdf
    priority: 9
  - type: regex
    pattern: "\\.pdf$"
    priority: 8
---

# PDF Tools Skill

Create, read, merge, split, and convert PDFs.

## Dependencies
Uses `pdf-lib` and `pdf-parse` for Node.js-native PDF operations (no external binaries needed).
For PDF-to-image conversion, requires `poppler-utils` (pdftoppm).

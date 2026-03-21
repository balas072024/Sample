---
name: ocr
version: "1.0.0"
description: Extract text from images and scanned documents using OCR.
author: Arivumaiyam AI
tags: [ocr, text-extraction, tesseract]
permissions: [ocr.extract, filesystem.read, filesystem.write]
tools:
  - name: ocr_image
    description: Extract text from an image file
    permissions: [ocr.extract, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        language: { type: string, description: "OCR language (e.g. eng, tam, hin, jpn)" }
        outputFormat: { type: string, enum: [text, hocr, tsv, pdf] }
      required: [path]
  - name: ocr_pdf
    description: Extract text from a scanned PDF
    permissions: [ocr.extract, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        pages: { type: string }
        language: { type: string }
      required: [path]
  - name: ocr_screenshot
    description: Take a screenshot and extract text from it
    permissions: [ocr.extract, system.screenshot]
    inputSchema:
      type: object
      properties:
        region: { type: object, properties: { x: { type: number }, y: { type: number }, width: { type: number }, height: { type: number } } }
triggers:
  - type: keyword
    pattern: ocr
    priority: 9
  - type: keyword
    pattern: extract text from image
    priority: 8
  - type: keyword
    pattern: read text from
    priority: 5
---

# OCR Skill

Extract text from images and scanned documents.

## Requirements
- Tesseract OCR (`tesseract` binary)
- Install: `sudo apt install tesseract-ocr` or `brew install tesseract`
- Additional languages: `sudo apt install tesseract-ocr-tam tesseract-ocr-hin`

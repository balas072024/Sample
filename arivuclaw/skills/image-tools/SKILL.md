---
name: image-tools
version: "1.0.0"
description: Resize, crop, convert, compress, and generate images. AI image generation support.
author: Arivumaiyam AI
tags:
  - image
  - resize
  - convert
  - generate
  - compress
permissions:
  - image.process
  - filesystem.read
  - filesystem.write
  - network.http
tools:
  - name: image_resize
    description: Resize an image to specified dimensions
    permissions: [image.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        width: { type: number }
        height: { type: number }
        outputPath: { type: string }
        keepAspect: { type: boolean }
      required: [path, outputPath]
  - name: image_convert
    description: Convert image between formats (png, jpg, webp, gif, avif)
    permissions: [image.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        outputPath: { type: string }
        format: { type: string, enum: [png, jpg, webp, gif, avif] }
        quality: { type: number, description: "Quality 1-100 (for lossy formats)" }
      required: [path, outputPath, format]
  - name: image_compress
    description: Compress an image to reduce file size
    permissions: [image.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        outputPath: { type: string }
        quality: { type: number }
      required: [path, outputPath]
  - name: image_crop
    description: Crop an image to specified region
    permissions: [image.process, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        x: { type: number }
        y: { type: number }
        width: { type: number }
        height: { type: number }
        outputPath: { type: string }
      required: [path, x, y, width, height, outputPath]
  - name: image_info
    description: Get image metadata (size, format, dimensions, EXIF)
    permissions: [image.process, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string }
      required: [path]
  - name: image_generate
    description: Generate an image using AI (requires API key for DALL-E, Stable Diffusion, etc.)
    permissions: [image.process, network.http, filesystem.write]
    inputSchema:
      type: object
      properties:
        prompt: { type: string }
        outputPath: { type: string }
        size: { type: string, enum: ["256x256", "512x512", "1024x1024"] }
        provider: { type: string, enum: [dalle, stability, local] }
      required: [prompt, outputPath]
triggers:
  - type: keyword
    pattern: image
    priority: 7
  - type: keyword
    pattern: resize
    priority: 6
  - type: keyword
    pattern: compress
    priority: 5
  - type: keyword
    pattern: screenshot
    priority: 7
  - type: regex
    pattern: "\\.(png|jpg|jpeg|webp|gif|avif)$"
    priority: 6
---

# Image Tools Skill

Process, convert, and generate images.

## Dependencies
Uses `sharp` for high-performance image processing (Node.js native).
For AI generation, configure your preferred provider in config.

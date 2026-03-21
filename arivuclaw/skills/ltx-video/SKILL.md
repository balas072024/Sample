---
name: ltx-video
version: 1.0.0
description: "LTX-Video (Lightricks) — fastest open-source video generator. Produces 30fps video faster than real-time. Runs on 12GB VRAM."
author: Arivumaiyam AI
tags:
  - ltx
  - video
  - fast
  - real-time
  - lightricks
  - local
permissions:
  - system.process
  - code.execute
  - filesystem.write
  - unrestricted
tools:
  - name: ltx_generate
    description: Generate video from text (faster than real-time)
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        negativePrompt:
          type: string
          description: Negative prompt to avoid unwanted content
        numFrames:
          type: number
          description: Number of frames to generate
        height:
          type: number
          description: Output video height in pixels
        width:
          type: number
          description: Output video width in pixels
        fps:
          type: number
          description: Frames per second for the output video
        guidanceScale:
          type: number
          description: Classifier-free guidance scale
        seed:
          type: number
          description: Random seed for reproducibility
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
  - name: ltx_image_to_video
    description: Animate image to video
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the source image to animate
        prompt:
          type: string
          description: Text prompt to guide the animation
        numFrames:
          type: number
          description: Number of frames to generate
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - imagePath
        - outputPath
triggers:
  - type: keyword
    keyword: ltx
    priority: 9
  - type: keyword
    keyword: fast video
    priority: 6
---

# LTX Video

LTX-Video (Lightricks) video generation skill for Arivumaiyam AI. The fastest open-source video generator, producing 30fps video faster than real-time on 12GB VRAM.

## Usage

Generate videos from text prompts or animate images at faster-than-real-time speeds using the LTX-Video model.

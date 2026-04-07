---
name: cogvideo
version: 1.0.0
description: "CogVideoX-5B (Tsinghua/Zhipu) — lightweight video generation, 6-second clips, efficient on moderate GPUs."
author: ArivuClaw
tags:
  - cogvideo
  - video
  - open-source
  - lightweight
  - local
permissions:
  - system.process
  - code.execute
  - filesystem.write
  - unrestricted
tools:
  - name: cogvideo_generate
    description: Generate a short video from text
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        numFrames:
          type: number
          description: Number of frames to generate
        resolution:
          type: string
          enum:
            - 480x720
            - 720x480
          description: Output video resolution
        guidanceScale:
          type: number
          description: Classifier-free guidance scale
        numInferenceSteps:
          type: number
          description: Number of inference steps
        seed:
          type: number
          description: Random seed for reproducibility
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
  - name: cogvideo_image_to_video
    description: Generate video from image + text
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the source image
        prompt:
          type: string
          description: Text prompt to guide the video generation
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - imagePath
        - outputPath
triggers:
  - type: keyword
    keyword: cogvideo
    priority: 9
---

# CogVideo

CogVideoX-5B (Tsinghua/Zhipu) video generation skill for ArivuClaw. A lightweight model for generating 6-second video clips, efficient enough to run on moderate GPUs.

## Usage

Generate short video clips from text prompts or animate images with text guidance using the CogVideoX-5B model.

---
name: wan-video
version: 1.0.0
description: "Wan 2.2 (Alibaba) — SOTA open-source video generation. Text-to-video and image-to-video with MoE architecture. Runs locally on consumer GPUs (8GB+ VRAM)."
author: ArivuClaw
tags:
  - wan
  - video
  - open-source
  - local
  - text-to-video
  - alibaba
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - filesystem.write
  - unrestricted
tools:
  - name: wan_text_to_video
    description: Generate video from text
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        model:
          type: string
          enum:
            - T2V-1.3B
            - T2V-A14B
          description: Wan model variant to use
        steps:
          type: number
          description: Number of inference steps
        guidanceScale:
          type: number
          description: Classifier-free guidance scale
        numFrames:
          type: number
          description: Number of frames to generate
        fps:
          type: number
          description: Frames per second for the output video
        resolution:
          type: string
          description: Output resolution (e.g. "1280x720")
        seed:
          type: number
          description: Random seed for reproducibility
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
  - name: wan_image_to_video
    description: Animate an image
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the source image to animate
        prompt:
          type: string
          description: Text prompt to guide the animation
        model:
          type: string
          enum:
            - I2V-A14B
          description: Wan image-to-video model variant
        steps:
          type: number
          description: Number of inference steps
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - imagePath
        - outputPath
  - name: wan_download_model
    description: Download Wan 2.2 model weights from HuggingFace
    inputSchema:
      type: object
      properties:
        model:
          type: string
          enum:
            - T2V-1.3B
            - T2V-A14B
            - I2V-A14B
          description: Model variant to download
        outputDir:
          type: string
          description: Directory to save the model weights
      required:
        - model
triggers:
  - type: keyword
    keyword: wan
    priority: 8
  - type: keyword
    keyword: wan2
    priority: 9
  - type: keyword
    keyword: local video
    priority: 6
---

# Wan Video

Wan 2.2 (Alibaba) video generation skill for ArivuClaw. State-of-the-art open-source video generation with MoE architecture, capable of running locally on consumer GPUs with 8GB+ VRAM.

## Usage

Generate videos from text prompts or animate images using locally-hosted Wan 2.2 models. Download model weights from HuggingFace before first use.

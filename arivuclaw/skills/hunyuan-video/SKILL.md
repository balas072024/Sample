---
name: hunyuan-video
version: 1.0.0
description: "Tencent HunyuanVideo — 13B parameter open-source video gen. Cinematic quality, image-to-video, audio-driven avatar animation."
author: Arivumaiyam AI
tags:
  - hunyuan
  - video
  - tencent
  - open-source
  - avatar
  - cinematic
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - filesystem.write
  - unrestricted
tools:
  - name: hunyuan_text_to_video
    description: Generate video from text prompt
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        steps:
          type: number
          description: Number of inference steps
        guidanceScale:
          type: number
          description: Classifier-free guidance scale
        numFrames:
          type: number
          description: Number of frames to generate
        resolution:
          type: string
          description: Output resolution (e.g. "1280x720")
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
  - name: hunyuan_image_to_video
    description: Animate an image into video
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the source image to animate
        prompt:
          type: string
          description: Text prompt to guide the animation
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - imagePath
        - outputPath
  - name: hunyuan_avatar
    description: Generate audio-driven human animation
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the reference human image
        audioPath:
          type: string
          description: Path to the audio file for driving the animation
        outputPath:
          type: string
          description: File path to save the generated avatar video
      required:
        - imagePath
        - audioPath
        - outputPath
  - name: hunyuan_custom
    description: Multimodal customized video generation
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        referenceImages:
          type: array
          items:
            type: string
          description: Array of paths to reference images
        style:
          type: string
          description: Visual style to apply
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
triggers:
  - type: keyword
    keyword: hunyuan
    priority: 9
  - type: keyword
    keyword: avatar video
    priority: 7
---

# Hunyuan Video

Tencent HunyuanVideo skill for Arivumaiyam AI. A 13B parameter open-source video generation model delivering cinematic quality with support for text-to-video, image-to-video, audio-driven avatar animation, and multimodal customized generation.

## Usage

Generate cinematic-quality videos from text, animate images, create audio-driven avatar animations, or produce customized videos with reference images and style control.

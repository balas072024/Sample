---
name: sora-video
version: 1.0.0
description: "OpenAI Sora 2 video generation — text-to-video, image-to-video, video editing, with synced audio."
author: ArivuClaw
tags:
  - sora
  - video
  - openai
  - generation
  - text-to-video
permissions:
  - network.http
  - filesystem.write
  - unrestricted
tools:
  - name: sora_generate
    description: Generate video from text prompt
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        model:
          type: string
          enum:
            - sora-2
            - sora-2-pro
          description: Sora model variant to use
        duration:
          type: number
          enum:
            - 5
            - 10
            - 16
            - 20
          description: Video duration in seconds
        resolution:
          type: string
          enum:
            - 480p
            - 720p
            - 1080p
          description: Output video resolution
        aspectRatio:
          type: string
          enum:
            - "16:9"
            - "9:16"
            - "1:1"
          description: Video aspect ratio
        style:
          type: string
          description: Visual style to apply to the generated video
        audioEnabled:
          type: boolean
          description: Whether to generate synced audio with the video
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
  - name: sora_image_to_video
    description: Generate video from an image
    inputSchema:
      type: object
      properties:
        imagePath:
          type: string
          description: Path to the source image
        prompt:
          type: string
          description: Text prompt to guide the video generation
        duration:
          type: number
          description: Video duration in seconds
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - imagePath
        - outputPath
  - name: sora_extend
    description: Extend an existing video clip
    inputSchema:
      type: object
      properties:
        videoPath:
          type: string
          description: Path to the existing video to extend
        prompt:
          type: string
          description: Text prompt to guide the extension
        extendBy:
          type: number
          description: Number of seconds to extend the video by
        outputPath:
          type: string
          description: File path to save the extended video
      required:
        - videoPath
        - outputPath
  - name: sora_edit
    description: Edit a video with targeted changes
    inputSchema:
      type: object
      properties:
        videoPath:
          type: string
          description: Path to the video to edit
        editPrompt:
          type: string
          description: Description of the edits to apply
        outputPath:
          type: string
          description: File path to save the edited video
      required:
        - videoPath
        - editPrompt
        - outputPath
  - name: sora_status
    description: Check video generation job status
    inputSchema:
      type: object
      properties:
        jobId:
          type: string
          description: The job ID to check status for
      required:
        - jobId
triggers:
  - type: keyword
    keyword: sora
    priority: 9
  - type: keyword
    keyword: generate video
    priority: 7
  - type: keyword
    keyword: text to video
    priority: 8
---

# Sora Video

OpenAI Sora 2 video generation skill for ArivuClaw. Supports text-to-video, image-to-video, video editing, and extension with synced audio generation.

## Usage

Generate videos from text prompts, animate images, extend existing clips, or edit videos with targeted changes using OpenAI's Sora 2 model.

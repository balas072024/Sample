---
name: video-editor
version: 1.0.0
description: "Video editing toolkit — trim, merge, resize, add audio, extract frames, convert formats using ffmpeg."
author: Arivumaiyam AI
tags:
  - video
  - edit
  - ffmpeg
  - trim
  - merge
  - convert
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - filesystem.write
environment:
  binaries:
    - ffmpeg
tools:
  - name: video_trim
    description: Trim video to specific time range
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input video file
        startTime:
          type: string
          description: "Start time for the trim (e.g. \"00:01:30\")"
        endTime:
          type: string
          description: "End time for the trim (e.g. \"00:02:45\")"
        outputPath:
          type: string
          description: File path to save the trimmed video
      required:
        - inputPath
        - startTime
        - endTime
        - outputPath
  - name: video_merge
    description: Merge multiple videos
    inputSchema:
      type: object
      properties:
        inputPaths:
          type: array
          items:
            type: string
          description: Array of paths to videos to merge
        outputPath:
          type: string
          description: File path to save the merged video
        transition:
          type: string
          description: Transition effect between clips
      required:
        - inputPaths
        - outputPath
  - name: video_resize
    description: Resize/rescale video
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input video file
        width:
          type: number
          description: Target width in pixels
        height:
          type: number
          description: Target height in pixels
        outputPath:
          type: string
          description: File path to save the resized video
      required:
        - inputPath
        - outputPath
  - name: video_add_audio
    description: Add or replace audio track
    inputSchema:
      type: object
      properties:
        videoPath:
          type: string
          description: Path to the input video file
        audioPath:
          type: string
          description: Path to the audio file to add
        outputPath:
          type: string
          description: File path to save the output video
        replace:
          type: boolean
          description: Whether to replace existing audio track
      required:
        - videoPath
        - audioPath
        - outputPath
  - name: video_extract_frames
    description: Extract frames as images
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input video file
        outputDir:
          type: string
          description: Directory to save extracted frames
        fps:
          type: number
          description: Frames per second to extract
        format:
          type: string
          enum:
            - png
            - jpg
          description: Output image format
      required:
        - inputPath
        - outputDir
  - name: video_convert
    description: Convert video format
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input video file
        outputPath:
          type: string
          description: File path to save the converted video
        codec:
          type: string
          enum:
            - h264
            - h265
            - vp9
            - av1
          description: Video codec to use
        quality:
          type: number
          description: Quality setting for encoding
      required:
        - inputPath
        - outputPath
  - name: video_info
    description: Get video metadata
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the video file to inspect
      required:
        - inputPath
triggers:
  - type: keyword
    keyword: video edit
    priority: 7
  - type: keyword
    keyword: trim video
    priority: 7
  - type: keyword
    keyword: ffmpeg
    priority: 8
  - type: keyword
    keyword: merge video
    priority: 7
---

# Video Editor

Video editing toolkit skill for Arivumaiyam AI. Provides trim, merge, resize, audio overlay, frame extraction, and format conversion capabilities powered by ffmpeg.

## Usage

Perform common video editing operations including trimming to time ranges, merging multiple clips, resizing, adding or replacing audio tracks, extracting frames as images, converting between formats, and inspecting video metadata.

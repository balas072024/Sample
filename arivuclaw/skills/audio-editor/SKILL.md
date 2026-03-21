---
name: audio-editor
version: "1.0.0"
description: "Audio editing toolkit — trim, merge, convert, normalize, split, extract from video, using ffmpeg and sox."
author: ArivuClaw
tags:
  - audio
  - edit
  - ffmpeg
  - sox
  - trim
  - convert
  - merge
permissions:
  - system.process
  - code.execute
  - filesystem.read
  - filesystem.write
environment:
  binaries:
    - ffmpeg
tools:
  - name: audio_trim
    description: Trim audio to time range
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input audio file
        startTime:
          type: string
          description: "Start time (e.g. \"00:01:30\")"
        endTime:
          type: string
          description: "End time (e.g. \"00:03:45\")"
        outputPath:
          type: string
          description: Output file path for trimmed audio
      required:
        - inputPath
        - startTime
        - endTime
        - outputPath
  - name: audio_merge
    description: Merge/concatenate audio files
    inputSchema:
      type: object
      properties:
        inputPaths:
          type: array
          items:
            type: string
          description: Array of input audio file paths to merge
        outputPath:
          type: string
          description: Output file path for merged audio
        crossfade:
          type: number
          description: Crossfade duration in seconds between clips
      required:
        - inputPaths
        - outputPath
  - name: audio_convert
    description: Convert audio format
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input audio file
        outputPath:
          type: string
          description: Output file path for converted audio
        format:
          type: string
          enum:
            - mp3
            - wav
            - ogg
            - flac
            - aac
            - m4a
          description: Target audio format
        bitrate:
          type: string
          description: "Target bitrate (e.g. \"192k\")"
        sampleRate:
          type: number
          description: Target sample rate in Hz
      required:
        - inputPath
        - outputPath
  - name: audio_normalize
    description: Normalize audio volume
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input audio file
        outputPath:
          type: string
          description: Output file path for normalized audio
        targetLoudness:
          type: number
          description: Target loudness in LUFS
      required:
        - inputPath
        - outputPath
  - name: audio_split
    description: Split audio by silence or time intervals
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input audio file
        outputDir:
          type: string
          description: Output directory for split audio files
        method:
          type: string
          enum:
            - silence
            - interval
          description: Split method
        intervalSeconds:
          type: number
          description: Interval duration in seconds (for interval method)
      required:
        - inputPath
        - outputDir
  - name: audio_extract
    description: Extract audio from video file
    inputSchema:
      type: object
      properties:
        videoPath:
          type: string
          description: Path to the input video file
        outputPath:
          type: string
          description: Output file path for extracted audio
        format:
          type: string
          enum:
            - mp3
            - wav
            - aac
          description: Output audio format
      required:
        - videoPath
        - outputPath
  - name: audio_info
    description: Get audio file metadata
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the audio file
      required:
        - inputPath
triggers:
  - type: keyword
    pattern: "audio edit"
    priority: 7
  - type: keyword
    pattern: "trim audio"
    priority: 7
  - type: keyword
    pattern: "extract audio"
    priority: 7
  - type: keyword
    pattern: "convert audio"
    priority: 6
---

# Audio Editor

Audio editing toolkit — trim, merge, convert, normalize, split, extract from video, using ffmpeg and sox.

## Tools

### audio_trim
Trim audio to a specified time range with start and end timestamps.

### audio_merge
Merge or concatenate multiple audio files with optional crossfade between clips.

### audio_convert
Convert audio between formats (MP3, WAV, OGG, FLAC, AAC, M4A) with optional bitrate and sample rate settings.

### audio_normalize
Normalize audio volume to a target loudness level in LUFS.

### audio_split
Split audio files by silence detection or fixed time intervals.

### audio_extract
Extract the audio track from a video file.

### audio_info
Get metadata and technical information about an audio file.

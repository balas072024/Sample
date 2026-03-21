---
name: whisper-stt
version: 1.0.0
description: Speech-to-text transcription using OpenAI Whisper, supporting local model inference and API modes.
author: ArivuClaw
tags:
  - ai
  - speech
  - transcription
  - whisper
permissions:
  - read_files
  - write_files
  - network_access
  - execute_commands
tools:
  - name: transcribe
    description: Transcribes an audio file to text using Whisper.
    permissions:
      - read_files
      - write_files
      - network_access
      - execute_commands
    inputSchema:
      type: object
      properties:
        audio_path:
          type: string
          description: Path to the audio file (mp3, wav, m4a, flac, ogg, webm).
        model:
          type: string
          enum: [tiny, base, small, medium, large, large-v3]
          description: Whisper model size. Larger models are more accurate but slower.
          default: base
        mode:
          type: string
          enum: [local, api]
          description: Run locally or via OpenAI API.
          default: local
        language:
          type: string
          description: Language code (e.g., "en", "es", "ja"). Auto-detected if omitted.
        output_format:
          type: string
          enum: [text, srt, vtt, json, tsv]
          description: Output transcript format.
          default: text
        output_path:
          type: string
          description: Path to save the transcript file.
      required:
        - audio_path
  - name: translate
    description: Transcribes and translates audio to English.
    permissions:
      - read_files
      - write_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        audio_path:
          type: string
          description: Path to the audio file.
        model:
          type: string
          enum: [tiny, base, small, medium, large, large-v3]
          default: base
        output_path:
          type: string
          description: Path to save the translated transcript.
      required:
        - audio_path
  - name: detect_language
    description: Detects the spoken language in an audio file.
    permissions:
      - read_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        audio_path:
          type: string
          description: Path to the audio file.
        model:
          type: string
          enum: [tiny, base, small, medium, large, large-v3]
          default: base
      required:
        - audio_path
triggers:
  - pattern: "transcribe {file}"
  - pattern: "speech to text {file}"
  - pattern: "translate audio {file}"
  - pattern: "detect language in {file}"
---

# Whisper STT

Speech-to-text transcription using OpenAI Whisper with support for local model inference and API modes.

## Usage

```
transcribe recording.mp3
speech to text meeting.wav
translate audio interview_spanish.m4a
detect language in clip.ogg
```

## Features

- Multiple model sizes: tiny through large-v3
- Local inference and OpenAI API modes
- Multi-format output: text, SRT, VTT, JSON, TSV
- Language detection and auto-detection
- Audio translation to English

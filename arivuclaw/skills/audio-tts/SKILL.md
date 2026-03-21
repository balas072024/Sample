---
name: audio-tts
version: "1.0.0"
description: Text-to-speech, speech-to-text, audio playback, and audio file conversion.
author: Arivumaiyam AI
tags: [audio, tts, speech, voice]
permissions: [system.audio, network.http, filesystem.read, filesystem.write]
tools:
  - name: text_to_speech
    description: Convert text to spoken audio
    permissions: [system.audio, filesystem.write]
    inputSchema:
      type: object
      properties:
        text: { type: string }
        outputPath: { type: string }
        language: { type: string, description: "Language code (default: en)" }
        voice: { type: string, description: "Voice name (system-dependent)" }
        speed: { type: number, description: "Speech rate multiplier (default: 1.0)" }
      required: [text]
  - name: play_audio
    description: Play an audio file through system speakers
    permissions: [system.audio, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string }
      required: [path]
  - name: audio_convert
    description: Convert audio between formats (mp3, wav, ogg, flac, aac)
    permissions: [system.audio, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        outputPath: { type: string }
        format: { type: string, enum: [mp3, wav, ogg, flac, aac] }
      required: [path, outputPath, format]
  - name: speech_to_text
    description: Transcribe audio to text (requires Whisper or cloud API)
    permissions: [system.audio, filesystem.read, network.http]
    inputSchema:
      type: object
      properties:
        path: { type: string }
        language: { type: string }
      required: [path]
triggers:
  - type: keyword
    pattern: speak
    priority: 7
  - type: keyword
    pattern: audio
    priority: 6
  - type: keyword
    pattern: voice
    priority: 6
  - type: keyword
    pattern: transcribe
    priority: 8
---

# Audio & TTS Skill

Text-to-speech, speech-to-text, and audio processing.

## Requirements
- TTS: `espeak-ng` (Linux), `say` (macOS), or cloud API
- STT: OpenAI Whisper (local or API)
- Audio conversion: `ffmpeg`

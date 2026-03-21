---
name: cosyvoice-tts
version: "1.0.0"
description: "CosyVoice2 — ultra-low latency streaming TTS. 150ms latency, real-time speech synthesis, voice cloning."
author: Arivumaiyam AI
tags:
  - cosyvoice
  - tts
  - streaming
  - real-time
  - low-latency
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.write
  - unrestricted
tools:
  - name: cosyvoice_generate
    description: Generate speech
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to convert to speech
        voice:
          type: string
          description: Voice to use for generation
        language:
          type: string
          description: Language for speech synthesis
        speed:
          type: number
          description: Speech speed multiplier
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - text
        - outputPath
  - name: cosyvoice_stream
    description: Real-time streaming TTS
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to stream as speech
        voice:
          type: string
          description: Voice to use for streaming
        latencyTarget:
          type: number
          description: Target latency in milliseconds
      required:
        - text
  - name: cosyvoice_clone
    description: Zero-shot voice cloning
    inputSchema:
      type: object
      properties:
        audioPath:
          type: string
          description: Path to the audio sample for voice cloning
        text:
          type: string
          description: Text to synthesize with the cloned voice
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - audioPath
        - text
        - outputPath
triggers:
  - type: keyword
    pattern: "cosyvoice"
    priority: 9
  - type: keyword
    pattern: "streaming tts"
    priority: 8
---

# CosyVoice TTS

CosyVoice2 — ultra-low latency streaming TTS. 150ms latency, real-time speech synthesis, voice cloning.

## Tools

### cosyvoice_generate
Generate speech from text with configurable voice, language, and speed.

### cosyvoice_stream
Real-time streaming TTS with ultra-low latency targeting 150ms.

### cosyvoice_clone
Zero-shot voice cloning from an audio sample. Synthesize new text with a cloned voice.

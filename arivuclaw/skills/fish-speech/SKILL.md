---
name: fish-speech
version: "1.0.0"
description: "Fish Speech V1.5 — SOTA open-source TTS with DualAR architecture. 300K+ hours training data, multi-language, voice cloning, ELO 1339."
author: Arivumaiyam AI
tags:
  - fish-speech
  - tts
  - voice
  - speech
  - open-source
  - clone
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.read
  - filesystem.write
  - unrestricted
tools:
  - name: fish_tts
    description: Generate speech from text
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to convert to speech
        voice:
          type: string
          description: Reference voice ID or path
        language:
          type: string
          enum:
            - en
            - zh
            - ja
            - ko
            - fr
            - de
            - es
            - ta
            - hi
            - ar
          description: Language for speech synthesis
        speed:
          type: number
          description: Speech speed multiplier
        emotion:
          type: string
          description: Emotion to apply to the speech
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - text
        - outputPath
  - name: fish_clone_voice
    description: Clone a voice from audio sample
    inputSchema:
      type: object
      properties:
        audioPath:
          type: string
          description: Path to the audio sample for voice cloning
        voiceName:
          type: string
          description: Name to assign to the cloned voice
        description:
          type: string
          description: Description of the cloned voice
      required:
        - audioPath
        - voiceName
  - name: fish_list_voices
    description: List available voices
    inputSchema:
      type: object
      properties: {}
  - name: fish_stream
    description: Stream TTS output in real-time
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to stream as speech
        voice:
          type: string
          description: Voice to use for streaming
        language:
          type: string
          description: Language for speech synthesis
      required:
        - text
triggers:
  - type: keyword
    pattern: "fish speech"
    priority: 9
  - type: keyword
    pattern: "tts"
    priority: 6
  - type: keyword
    pattern: "text to speech"
    priority: 7
  - type: keyword
    pattern: "speak"
    priority: 4
---

# Fish Speech

Fish Speech V1.5 — SOTA open-source TTS with DualAR architecture. 300K+ hours training data, multi-language, voice cloning, ELO 1339.

## Tools

### fish_tts
Generate speech from text using Fish Speech. Supports multiple languages, voice selection, speed control, and emotion styling.

### fish_clone_voice
Clone a voice from an audio sample. Provide a reference audio file and a name for the new voice profile.

### fish_list_voices
List all available voices including built-in and cloned voice profiles.

### fish_stream
Stream TTS output in real-time for low-latency speech generation.

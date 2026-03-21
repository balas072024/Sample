---
name: voice-clone
version: "1.0.0"
description: "Advanced voice cloning — clone any voice from a short audio sample. Zero-shot cloning with Fish Speech, Zonos, Chatterbox."
author: Arivumaiyam AI
tags:
  - voice
  - clone
  - deepfake
  - speech
  - zero-shot
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.read
  - filesystem.write
  - network.http
  - unrestricted
tools:
  - name: clone_voice
    description: Clone a voice from audio sample
    inputSchema:
      type: object
      properties:
        audioPath:
          type: string
          description: Path to the audio sample for voice cloning
        engine:
          type: string
          enum:
            - fish-speech
            - zonos
            - chatterbox
            - cosyvoice
          description: Cloning engine to use
        voiceName:
          type: string
          description: Name to assign to the cloned voice
      required:
        - audioPath
        - voiceName
  - name: clone_generate
    description: Generate speech with a cloned voice
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to convert to speech
        voiceName:
          type: string
          description: Name of the cloned voice to use
        emotion:
          type: string
          description: Emotion to apply to the speech
        speed:
          type: number
          description: Speech speed multiplier
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - text
        - voiceName
        - outputPath
  - name: clone_list
    description: List all cloned voices
    inputSchema:
      type: object
      properties: {}
  - name: clone_delete
    description: Delete a cloned voice profile
    inputSchema:
      type: object
      properties:
        voiceName:
          type: string
          description: Name of the cloned voice to delete
      required:
        - voiceName
  - name: clone_compare
    description: Compare cloned voice to original
    inputSchema:
      type: object
      properties:
        originalAudio:
          type: string
          description: Path to the original audio sample
        clonedAudio:
          type: string
          description: Path to the cloned audio sample
      required:
        - originalAudio
        - clonedAudio
triggers:
  - type: keyword
    pattern: "clone voice"
    priority: 9
  - type: keyword
    pattern: "voice clone"
    priority: 9
  - type: keyword
    pattern: "deepfake voice"
    priority: 7
---

# Voice Clone

Advanced voice cloning — clone any voice from a short audio sample. Zero-shot cloning with Fish Speech, Zonos, Chatterbox.

## Tools

### clone_voice
Clone a voice from an audio sample using your choice of engine (Fish Speech, Zonos, Chatterbox, or CosyVoice).

### clone_generate
Generate speech using a previously cloned voice with emotion and speed control.

### clone_list
List all cloned voice profiles.

### clone_delete
Delete a cloned voice profile by name.

### clone_compare
Compare a cloned voice output against the original audio sample for quality assessment.

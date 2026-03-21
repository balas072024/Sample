---
name: musicgen-audio
version: "1.0.0"
description: "Meta AudioCraft — MusicGen + AudioGen for music and sound generation from text. Generate full songs, background music, and sound effects."
author: ArivuClaw
tags:
  - musicgen
  - audiocraft
  - music
  - meta
  - generation
  - sound
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.write
  - unrestricted
tools:
  - name: musicgen_generate
    description: Generate music from text description
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: "Text description of the music to generate (e.g. \"upbeat electronic dance music with heavy bass\")"
        model:
          type: string
          enum:
            - small
            - medium
            - large
            - melody
          description: Model size to use for generation
        duration:
          type: number
          description: Duration in seconds
        temperature:
          type: number
          description: Sampling temperature for generation
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - prompt
        - outputPath
  - name: musicgen_melody
    description: Generate music conditioned on a melody
    inputSchema:
      type: object
      properties:
        melodyPath:
          type: string
          description: Path to reference audio melody
        prompt:
          type: string
          description: Text description to guide generation
        duration:
          type: number
          description: Duration in seconds
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - melodyPath
        - prompt
        - outputPath
  - name: audiogen_sfx
    description: Generate sound effects from text
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: "Text description of the sound effect (e.g. \"thunder rolling in the distance\")"
        duration:
          type: number
          description: Duration in seconds
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - prompt
        - outputPath
  - name: musicgen_continue
    description: Continue/extend an existing audio clip
    inputSchema:
      type: object
      properties:
        audioPath:
          type: string
          description: Path to the existing audio clip to extend
        prompt:
          type: string
          description: Text description to guide continuation
        duration:
          type: number
          description: Duration in seconds to extend
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - audioPath
        - outputPath
triggers:
  - type: keyword
    pattern: "musicgen"
    priority: 9
  - type: keyword
    pattern: "generate music"
    priority: 8
  - type: keyword
    pattern: "sound effect"
    priority: 7
  - type: keyword
    pattern: "background music"
    priority: 7
---

# MusicGen Audio

Meta AudioCraft — MusicGen + AudioGen for music and sound generation from text. Generate full songs, background music, and sound effects.

## Tools

### musicgen_generate
Generate music from a text description. Choose from small, medium, large, or melody model sizes.

### musicgen_melody
Generate music conditioned on a reference melody audio file, guided by a text prompt.

### audiogen_sfx
Generate sound effects from a text description using AudioGen.

### musicgen_continue
Continue or extend an existing audio clip with optional text guidance.

---
name: sound-effects
version: "1.0.0"
description: "Generate, mix, and process sound effects and ambient audio for videos, games, and applications."
author: Arivumaiyam AI
tags:
  - sound
  - effects
  - sfx
  - ambient
  - audio
  - mix
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.read
  - filesystem.write
tools:
  - name: sfx_generate
    description: Generate a sound effect from description
    inputSchema:
      type: object
      properties:
        description:
          type: string
          description: Text description of the sound effect to generate
        duration:
          type: number
          description: Duration in seconds
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - description
        - outputPath
  - name: sfx_ambient
    description: Generate ambient background audio
    inputSchema:
      type: object
      properties:
        scene:
          type: string
          description: "Scene description (e.g. \"rainy forest\", \"busy cafe\", \"ocean waves\")"
        duration:
          type: number
          description: Duration in seconds
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - scene
        - outputPath
  - name: sfx_mix
    description: Mix multiple audio tracks together
    inputSchema:
      type: object
      properties:
        tracks:
          type: array
          items:
            type: object
            properties:
              path:
                type: string
                description: Path to the audio track
              volume:
                type: number
                description: Volume level for this track
            required:
              - path
          description: Array of audio tracks with path and volume
        outputPath:
          type: string
          description: Output file path for mixed audio
      required:
        - tracks
        - outputPath
  - name: sfx_apply_effect
    description: "Apply audio effects (reverb, echo, pitch shift, etc.)"
    inputSchema:
      type: object
      properties:
        inputPath:
          type: string
          description: Path to the input audio file
        effect:
          type: string
          enum:
            - reverb
            - echo
            - pitch_shift
            - speed
            - normalize
            - fade_in
            - fade_out
            - noise_reduction
          description: Audio effect to apply
        params:
          type: object
          description: Additional parameters for the effect
        outputPath:
          type: string
          description: Output file path for processed audio
      required:
        - inputPath
        - effect
        - outputPath
triggers:
  - type: keyword
    pattern: "sound effect"
    priority: 8
  - type: keyword
    pattern: "ambient"
    priority: 5
  - type: keyword
    pattern: "sfx"
    priority: 8
  - type: keyword
    pattern: "audio mix"
    priority: 7
---

# Sound Effects

Generate, mix, and process sound effects and ambient audio for videos, games, and applications.

## Tools

### sfx_generate
Generate a sound effect from a text description.

### sfx_ambient
Generate ambient background audio for a described scene.

### sfx_mix
Mix multiple audio tracks together with individual volume control.

### sfx_apply_effect
Apply audio effects such as reverb, echo, pitch shift, speed change, normalization, fade in/out, and noise reduction.

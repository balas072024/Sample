---
name: amphion-audio
version: "1.0.0"
description: "Amphion — comprehensive audio/music/speech generation toolkit. VITS, VALL-E, NaturalSpeech2, FastSpeech2, and more."
author: Arivumaiyam AI
tags:
  - amphion
  - audio
  - toolkit
  - speech
  - music
  - research
permissions:
  - system.process
  - code.execute
  - system.audio
  - filesystem.read
  - filesystem.write
  - unrestricted
tools:
  - name: amphion_tts
    description: Run a TTS model from Amphion
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to convert to speech
        model:
          type: string
          enum:
            - vits
            - fastspeech2
            - valle
            - naturalspeech2
            - maskgct
          description: TTS model to use
        voice:
          type: string
          description: Voice to use for synthesis
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - text
        - outputPath
  - name: amphion_vc
    description: "Voice conversion — change voice while preserving content"
    inputSchema:
      type: object
      properties:
        inputAudio:
          type: string
          description: Path to the input audio file
        targetVoice:
          type: string
          description: Target voice ID or path for conversion
        outputPath:
          type: string
          description: Output file path for converted audio
      required:
        - inputAudio
        - targetVoice
        - outputPath
  - name: amphion_sing
    description: Singing voice synthesis
    inputSchema:
      type: object
      properties:
        lyrics:
          type: string
          description: Lyrics for the singing synthesis
        melody:
          type: string
          description: Melody reference or notation
        voice:
          type: string
          description: Singing voice to use
        outputPath:
          type: string
          description: Output file path for generated audio
      required:
        - lyrics
        - outputPath
  - name: amphion_train
    description: Train a custom audio model
    inputSchema:
      type: object
      properties:
        config:
          type: string
          description: Path to the training configuration file
        dataDir:
          type: string
          description: Path to the training data directory
        modelType:
          type: string
          enum:
            - tts
            - vc
            - singing
          description: Type of model to train
        epochs:
          type: number
          description: Number of training epochs
      required:
        - config
        - dataDir
triggers:
  - type: keyword
    pattern: "amphion"
    priority: 9
  - type: keyword
    pattern: "voice conversion"
    priority: 8
  - type: keyword
    pattern: "singing"
    priority: 6
---

# Amphion Audio

Amphion — comprehensive audio/music/speech generation toolkit. VITS, VALL-E, NaturalSpeech2, FastSpeech2, and more.

## Tools

### amphion_tts
Run a TTS model from Amphion's collection including VITS, FastSpeech2, VALL-E, NaturalSpeech2, and MaskGCT.

### amphion_vc
Voice conversion — change the voice of an audio recording while preserving the spoken content.

### amphion_sing
Singing voice synthesis from lyrics with optional melody and voice selection.

### amphion_train
Train a custom audio model (TTS, voice conversion, or singing) with your own data and configuration.

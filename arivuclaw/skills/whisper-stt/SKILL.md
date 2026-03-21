---
name: whisper-stt
version: "1.0.0"
description: OpenAI Whisper speech-to-text for transcribing audio and video files using local models or the API.
author: Arivumaiyam AI
tags: [whisper, speech-to-text, transcription, audio, stt]
permissions: [network.fetch, filesystem.read, filesystem.write]
tools:
  - name: whisper_transcribe
    description: Transcribe an audio or video file to text
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        file_path: { type: string, description: "Path to the audio or video file" }
        model: { type: string, enum: [tiny, base, small, medium, large, large-v2, large-v3], description: "Whisper model size to use" }
        language: { type: string, description: "Language code hint (e.g. en, es, fr)" }
        output_format: { type: string, enum: [text, srt, vtt, json, tsv], description: "Output format for the transcription" }
        output_path: { type: string, description: "File path to save the transcription" }
        timestamps: { type: boolean, description: "Whether to include word-level timestamps" }
      required: [file_path]
  - name: whisper_translate
    description: Transcribe and translate audio to English text
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        file_path: { type: string, description: "Path to the audio or video file" }
        model: { type: string, enum: [tiny, base, small, medium, large, large-v2, large-v3], description: "Whisper model size to use" }
        output_format: { type: string, enum: [text, srt, vtt, json, tsv], description: "Output format for the translation" }
        output_path: { type: string, description: "File path to save the translation" }
      required: [file_path]
  - name: whisper_detect_language
    description: Detect the spoken language in an audio file
    permissions: [filesystem.read, network.fetch]
    inputSchema:
      type: object
      properties:
        file_path: { type: string, description: "Path to the audio or video file" }
        model: { type: string, enum: [tiny, base, small, medium, large, large-v2, large-v3], description: "Whisper model size to use" }
        top_k: { type: number, description: "Number of top language predictions to return" }
      required: [file_path]
triggers:
  - type: keyword
    pattern: "transcribe|whisper|speech to text|stt|audio to text|dictation"
    priority: 7
---

# Whisper STT

You are a speech-to-text transcription assistant using OpenAI Whisper.

Help the user transcribe audio and video files to text. Recommend appropriate model sizes based on the trade-off between speed and accuracy. For long files, suggest using smaller models first for a quick preview. When the language is unknown, run detection first. Present transcriptions with clear formatting and offer multiple output formats. For translations, note that Whisper translates to English only. Report transcription confidence and flag segments with low confidence.

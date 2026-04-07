---
name: mochi-video
version: 1.0.0
description: "Mochi 1 (Genmo) — 10B parameter open video model with high-fidelity motion and strong prompt adherence. Apache 2.0 license."
author: ArivuClaw
tags:
  - mochi
  - video
  - genmo
  - open-source
  - high-fidelity
permissions:
  - system.process
  - code.execute
  - filesystem.write
  - unrestricted
tools:
  - name: mochi_generate
    description: Generate video from text
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text prompt describing the video to generate
        numFrames:
          type: number
          description: Number of frames to generate
        resolution:
          type: string
          description: Output resolution (e.g. "848x480")
        guidanceScale:
          type: number
          description: Classifier-free guidance scale
        seed:
          type: number
          description: Random seed for reproducibility
        outputPath:
          type: string
          description: File path to save the generated video
      required:
        - prompt
        - outputPath
triggers:
  - type: keyword
    keyword: mochi
    priority: 9
---

# Mochi Video

Mochi 1 (Genmo) video generation skill for ArivuClaw. A 10B parameter open video model delivering high-fidelity motion with strong prompt adherence, released under the Apache 2.0 license.

## Usage

Generate high-fidelity videos from text prompts with accurate motion and strong adherence to the provided description.

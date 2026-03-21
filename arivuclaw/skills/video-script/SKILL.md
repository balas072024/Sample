---
name: video-script
version: 1.0.0
description: Writes video scripts and YouTube content including intros, outros, scene breakdowns, and timestamps.
author: Arivumaiyam AI
tags:
  - content
  - video
  - youtube
  - scriptwriting
permissions:
  - read_files
  - write_files
tools:
  - name: write_script
    description: Generates a complete video script with scene breakdowns and dialogue.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        topic:
          type: string
          description: Video topic or title.
        style:
          type: string
          enum: [tutorial, vlog, explainer, review, documentary, short-form]
          default: explainer
        duration:
          type: string
          enum: [short, medium, long]
          description: Target duration (short ~3min, medium ~10min, long ~20min).
          default: medium
        audience:
          type: string
          description: Target audience description.
        include_timestamps:
          type: boolean
          description: Whether to include chapter timestamps.
          default: true
        output_path:
          type: string
          description: Path to save the script.
      required:
        - topic
  - name: generate_thumbnail_ideas
    description: Suggests thumbnail concepts and text overlays for the video.
    permissions: []
    inputSchema:
      type: object
      properties:
        topic:
          type: string
          description: Video topic.
        style:
          type: string
          description: Visual style preference.
      required:
        - topic
  - name: write_description
    description: Generates a YouTube-optimized video description with SEO tags.
    permissions: []
    inputSchema:
      type: object
      properties:
        topic:
          type: string
          description: Video topic.
        keywords:
          type: array
          items:
            type: string
          description: SEO keywords for the description.
        include_links:
          type: boolean
          default: true
      required:
        - topic
triggers:
  - pattern: "write video script about {topic}"
  - pattern: "create youtube script for {topic}"
  - pattern: "generate video description for {topic}"
  - pattern: "thumbnail ideas for {topic}"
---

# Video Script

Writes video scripts and YouTube content including structured scene breakdowns, timestamps, descriptions, and thumbnail ideas.

## Usage

```
write video script about Kubernetes basics
create youtube script for product review
generate video description for my tutorial
thumbnail ideas for Python crash course
```

## Features

- Multiple video styles: tutorial, vlog, explainer, review, documentary, short-form
- Scene-by-scene breakdown with dialogue
- Chapter timestamps for YouTube
- SEO-optimized descriptions and tags
- Thumbnail concept suggestions

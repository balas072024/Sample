---
name: screenshot
version: "1.0.0"
description: Take screenshots of the desktop, specific windows, or screen regions.
author: ArivuClaw
tags: [screenshot, capture, screen]
permissions: [system.screenshot, filesystem.write]
tools:
  - name: take_screenshot
    description: Capture a screenshot
    permissions: [system.screenshot, filesystem.write]
    inputSchema:
      type: object
      properties:
        type: { type: string, enum: [fullscreen, window, region], description: "Capture type" }
        outputPath: { type: string }
        delay: { type: number, description: "Delay in seconds before capture" }
        windowName: { type: string, description: "Window name (for window capture)" }
        region: { type: object, properties: { x: { type: number }, y: { type: number }, width: { type: number }, height: { type: number } } }
      required: [outputPath]
  - name: screen_record
    description: Record screen to video file
    permissions: [system.screenshot, filesystem.write, system.process]
    inputSchema:
      type: object
      properties:
        outputPath: { type: string }
        duration: { type: number, description: "Duration in seconds" }
        fps: { type: number }
      required: [outputPath, duration]
triggers:
  - type: keyword
    pattern: screenshot
    priority: 9
  - type: keyword
    pattern: screen capture
    priority: 8
  - type: keyword
    pattern: record screen
    priority: 8
---

# Screenshot Skill

Take screenshots and record screen.

## Requirements
- Linux: `scrot` or `gnome-screenshot` for screenshots, `ffmpeg` for recording
- macOS: Built-in `screencapture`
- Windows: PowerShell screenshot commands

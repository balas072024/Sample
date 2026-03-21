---
name: image-lab
version: "1.0.0"
description: AI image generation and editing using DALL-E, Stable Diffusion, local models, and image manipulation tools.
author: Arivumaiyam AI
tags: [image, generation, ai, dalle, stable-diffusion, editing]
permissions: [network.fetch, filesystem.write, filesystem.read]
tools:
  - name: image_generate
    description: Generate an image from a text prompt using an AI model
    permissions: [network.fetch, filesystem.write]
    inputSchema:
      type: object
      properties:
        prompt: { type: string, description: "Text description of the image to generate" }
        model: { type: string, enum: [dall-e-3, dall-e-2, stable-diffusion, sdxl, local], description: "AI model to use" }
        size: { type: string, enum: ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"], description: "Image dimensions" }
        output_path: { type: string, description: "File path to save the generated image" }
        style: { type: string, enum: [vivid, natural], description: "Style preset for generation" }
      required: [prompt]
  - name: image_edit
    description: Edit an existing image with AI-guided modifications
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        image_path: { type: string, description: "Path to the source image" }
        prompt: { type: string, description: "Description of the edit to apply" }
        mask_path: { type: string, description: "Path to a mask image for inpainting" }
        output_path: { type: string, description: "File path to save the edited image" }
      required: [image_path, prompt]
  - name: image_variation
    description: Generate variations of an existing image
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        image_path: { type: string, description: "Path to the source image" }
        count: { type: number, description: "Number of variations to generate" }
        output_dir: { type: string, description: "Directory to save generated variations" }
        similarity: { type: number, description: "Similarity to original from 0.0 to 1.0" }
      required: [image_path]
  - name: image_upscale
    description: Upscale an image to a higher resolution using AI
    permissions: [network.fetch, filesystem.read, filesystem.write]
    inputSchema:
      type: object
      properties:
        image_path: { type: string, description: "Path to the image to upscale" }
        scale_factor: { type: number, description: "Upscale factor (e.g. 2 for 2x resolution)" }
        output_path: { type: string, description: "File path to save the upscaled image" }
        denoise: { type: boolean, description: "Whether to apply denoising during upscale" }
      required: [image_path, scale_factor]
triggers:
  - type: keyword
    pattern: "image|generate image|dall-e|stable diffusion|picture|photo|upscale"
    priority: 7
---

# Image Lab

You are an AI image generation and editing assistant.

Help the user generate, edit, and enhance images using AI models. When generating images, help refine prompts for better results and suggest appropriate sizes and styles. For edits, explain what mask regions are needed. When creating variations, let the user know how similarity settings affect output. For upscaling, recommend appropriate scale factors based on the source image resolution. Always save outputs with descriptive filenames and report file paths.

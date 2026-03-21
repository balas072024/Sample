---
name: image-lab
version: 1.0.0
description: AI image generation using DALL-E, Stable Diffusion, or local models with prompt engineering and parameter control.
author: ArivuClaw
tags:
  - ai
  - image-generation
  - dall-e
  - stable-diffusion
permissions:
  - network_access
  - write_files
  - execute_commands
tools:
  - name: generate_image
    description: Generates an image from a text prompt using an AI model.
    permissions:
      - network_access
      - write_files
      - execute_commands
    inputSchema:
      type: object
      properties:
        prompt:
          type: string
          description: Text description of the image to generate.
        negative_prompt:
          type: string
          description: Elements to exclude from the generated image.
        model:
          type: string
          enum: [dall-e-3, dall-e-2, sdxl, sd-1.5, local]
          description: AI model to use for generation.
          default: dall-e-3
        size:
          type: string
          enum: ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"]
          description: Output image dimensions.
          default: "1024x1024"
        num_images:
          type: integer
          minimum: 1
          maximum: 4
          description: Number of images to generate.
          default: 1
        output_dir:
          type: string
          description: Directory to save generated images.
        seed:
          type: integer
          description: Random seed for reproducibility.
      required:
        - prompt
  - name: edit_image
    description: Edits an existing image using inpainting or outpainting.
    permissions:
      - network_access
      - write_files
    inputSchema:
      type: object
      properties:
        image_path:
          type: string
          description: Path to the source image.
        prompt:
          type: string
          description: Description of the desired edit.
        mask_path:
          type: string
          description: Path to a mask image for inpainting.
        output_path:
          type: string
          description: Path to save the edited image.
      required:
        - image_path
        - prompt
  - name: describe_image
    description: Generates a text description of an image for caption or prompt engineering.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        image_path:
          type: string
          description: Path to the image to describe.
        detail_level:
          type: string
          enum: [brief, detailed, prompt]
          description: Level of detail in the description.
          default: detailed
      required:
        - image_path
triggers:
  - pattern: "generate image of {prompt}"
  - pattern: "create image {prompt}"
  - pattern: "edit image {file}"
  - pattern: "describe image {file}"
---

# Image Lab

AI image generation using DALL-E, Stable Diffusion, or local models with prompt engineering and parameter control.

## Usage

```
generate image of a sunset over mountains
create image cyberpunk cityscape at night
edit image photo.png
describe image artwork.jpg
```

## Features

- Multi-model support: DALL-E 3, DALL-E 2, SDXL, SD 1.5, local models
- Configurable dimensions and batch generation
- Image editing with inpainting and masks
- Image description for captioning and prompt engineering
- Negative prompts and seed control for reproducibility

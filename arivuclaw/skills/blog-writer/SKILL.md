---
name: blog-writer
version: 1.0.0
description: Writes blog posts, articles, and content with configurable tone, length, and SEO optimization.
author: ArivuClaw
tags:
  - content
  - writing
  - blog
  - seo
permissions:
  - read_files
  - write_files
tools:
  - name: write_blog
    description: Generates a blog post or article based on the given topic and parameters.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        topic:
          type: string
          description: The blog post topic or title.
        tone:
          type: string
          enum: [professional, casual, technical, conversational, academic]
          default: professional
        length:
          type: string
          enum: [short, medium, long]
          description: Approximate post length (short ~500w, medium ~1000w, long ~2000w).
          default: medium
        audience:
          type: string
          description: Target audience for the content.
        keywords:
          type: array
          items:
            type: string
          description: SEO keywords to incorporate.
        output_path:
          type: string
          description: Path to save the generated post.
      required:
        - topic
  - name: generate_outline
    description: Creates a structured outline for a blog post before full generation.
    permissions: []
    inputSchema:
      type: object
      properties:
        topic:
          type: string
          description: The topic to outline.
        sections:
          type: integer
          description: Number of major sections.
          default: 5
      required:
        - topic
  - name: optimize_seo
    description: Analyzes and improves SEO for an existing blog post.
    permissions:
      - read_files
      - write_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the blog post file.
        target_keywords:
          type: array
          items:
            type: string
          description: Primary keywords to optimize for.
      required:
        - file_path
        - target_keywords
triggers:
  - pattern: "write a blog about {topic}"
  - pattern: "create article on {topic}"
  - pattern: "outline blog post about {topic}"
  - pattern: "optimize seo for {file}"
---

# Blog Writer

Writes blog posts, articles, and content with configurable tone, audience targeting, and SEO optimization.

## Usage

```
write a blog about containerization best practices
create article on AI in healthcare
outline blog post about remote work
optimize seo for posts/my-article.md
```

## Features

- Multiple tone options: professional, casual, technical, conversational, academic
- Configurable length: short, medium, long
- SEO keyword integration and optimization
- Structured outline generation before writing

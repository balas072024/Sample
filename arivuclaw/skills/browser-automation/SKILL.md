---
name: browser-automation
version: 1.0.0
description: Web browser automation for form filling, screenshots, scraping, and testing via Puppeteer or Playwright.
author: ArivuClaw
tags:
  - automation
  - browser
  - scraping
  - testing
permissions:
  - network_access
  - execute_commands
  - read_files
  - write_files
tools:
  - name: navigate
    description: Opens a URL in a headless browser and returns page content or a screenshot.
    permissions:
      - network_access
      - execute_commands
      - write_files
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: URL to navigate to.
        wait_for:
          type: string
          enum: [load, domcontentloaded, networkidle, selector]
          description: Wait condition before capturing.
          default: load
        wait_selector:
          type: string
          description: CSS selector to wait for (when wait_for is "selector").
        screenshot:
          type: boolean
          description: Capture a screenshot.
          default: false
        screenshot_path:
          type: string
          description: Path to save the screenshot.
        viewport:
          type: object
          properties:
            width:
              type: integer
              default: 1280
            height:
              type: integer
              default: 720
      required:
        - url
  - name: fill_form
    description: Fills and submits a web form by mapping field selectors to values.
    permissions:
      - network_access
      - execute_commands
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: URL of the page containing the form.
        fields:
          type: array
          items:
            type: object
            properties:
              selector:
                type: string
                description: CSS selector for the input field.
              value:
                type: string
                description: Value to enter.
              type:
                type: string
                enum: [text, select, checkbox, radio, file]
                default: text
          description: Form fields to fill.
        submit_selector:
          type: string
          description: CSS selector for the submit button.
        submit:
          type: boolean
          description: Whether to submit the form after filling.
          default: true
      required:
        - url
        - fields
  - name: scrape
    description: Extracts structured data from a web page using CSS selectors.
    permissions:
      - network_access
      - execute_commands
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: URL to scrape.
        selectors:
          type: object
          description: Named CSS selectors mapping field names to selectors.
        multiple:
          type: boolean
          description: Extract all matching elements (true) or just the first (false).
          default: false
        pagination:
          type: object
          properties:
            next_selector:
              type: string
              description: CSS selector for the next page button.
            max_pages:
              type: integer
              default: 5
          description: Pagination settings for multi-page scraping.
        output_format:
          type: string
          enum: [json, csv, text]
          default: json
      required:
        - url
        - selectors
  - name: run_script
    description: Executes custom JavaScript in the browser context.
    permissions:
      - network_access
      - execute_commands
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: URL to navigate to before running the script.
        script:
          type: string
          description: JavaScript code to execute in the page context.
        return_result:
          type: boolean
          description: Whether to return the script's return value.
          default: true
      required:
        - url
        - script
triggers:
  - pattern: "open {url}"
  - pattern: "screenshot {url}"
  - pattern: "fill form on {url}"
  - pattern: "scrape {url}"
  - pattern: "automate browser {task}"
---

# Browser Automation

Web browser automation for form filling, screenshots, scraping, and testing via Puppeteer or Playwright.

## Usage

```
open https://example.com
screenshot https://example.com/dashboard
fill form on https://example.com/login
scrape https://example.com/products
automate browser checkout flow
```

## Features

- Headless browser navigation with configurable viewports
- Form filling with support for text, select, checkbox, radio, and file inputs
- Structured data scraping with CSS selectors and pagination
- Custom JavaScript execution in page context
- Screenshot capture with wait conditions

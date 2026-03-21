---
name: browser-automation
version: "1.0.0"
description: Web browser automation via Puppeteer/Playwright for navigating pages, clicking elements, filling forms, taking screenshots, and scraping data.
author: Arivumaiyam AI
tags: [browser, automation, puppeteer, playwright, scraping]
permissions: [network.fetch, filesystem.write]
tools:
  - name: browser_navigate
    description: Navigate the browser to a specified URL
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        url: { type: string, description: "The URL to navigate to" }
        wait_until: { type: string, enum: [load, domcontentloaded, networkidle], description: "When to consider navigation complete" }
        timeout: { type: number, description: "Navigation timeout in milliseconds" }
      required: [url]
  - name: browser_click
    description: Click an element on the page using a CSS or XPath selector
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        selector: { type: string, description: "CSS or XPath selector for the element to click" }
        button: { type: string, enum: [left, right, middle], description: "Mouse button to use" }
        double_click: { type: boolean, description: "Whether to double-click the element" }
      required: [selector]
  - name: browser_type
    description: Type text into an input field identified by selector
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        selector: { type: string, description: "CSS or XPath selector for the input field" }
        text: { type: string, description: "Text to type into the field" }
        clear_first: { type: boolean, description: "Whether to clear the field before typing" }
        delay: { type: number, description: "Delay in milliseconds between keystrokes" }
      required: [selector, text]
  - name: browser_screenshot
    description: Take a screenshot of the current page or a specific element
    permissions: [network.fetch, filesystem.write]
    inputSchema:
      type: object
      properties:
        output_path: { type: string, description: "File path to save the screenshot" }
        selector: { type: string, description: "CSS selector to screenshot a specific element" }
        full_page: { type: boolean, description: "Whether to capture the full scrollable page" }
        format: { type: string, enum: [png, jpeg, webp], description: "Image format for the screenshot" }
      required: [output_path]
  - name: browser_scrape
    description: Extract structured data from the current page using selectors
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        selector: { type: string, description: "CSS selector for elements to scrape" }
        attributes: { type: array, items: { type: string }, description: "HTML attributes to extract from each element" }
        include_text: { type: boolean, description: "Whether to include inner text content" }
        limit: { type: number, description: "Maximum number of elements to return" }
      required: [selector]
triggers:
  - type: keyword
    pattern: "browser|automate|scrape|screenshot|navigate|puppeteer|playwright"
    priority: 7
---

# Browser Automation

You are a browser automation assistant using Puppeteer/Playwright.

When the user asks you to interact with web pages, use the browser tools to navigate, click, type, screenshot, and scrape as needed. Always confirm navigation succeeded before performing actions on page elements. Use appropriate wait strategies to handle dynamic content. When scraping, return data in a structured format. Save screenshots to the user's preferred location or a sensible default.

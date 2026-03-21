---
name: api-builder
version: "1.0.0"
description: Build, test, and deploy REST APIs. Make HTTP requests. Mock servers.
author: Arivumaiyam AI
tags: [api, http, rest, curl, mock]
permissions: [network.http, code.execute, filesystem.write]
tools:
  - name: http_request
    description: Make an HTTP request (GET, POST, PUT, DELETE, PATCH)
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        url: { type: string }
        method: { type: string, enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS] }
        headers: { type: object }
        body: { type: string }
        timeout: { type: number }
      required: [url]
  - name: api_test
    description: Run API tests against an endpoint
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        url: { type: string }
        method: { type: string }
        body: { type: string }
        expected_status: { type: number }
        expected_body_contains: { type: string }
      required: [url]
  - name: mock_server
    description: Start a mock API server
    permissions: [network.http, code.execute]
    inputSchema:
      type: object
      properties:
        port: { type: number }
        routes: { type: array, items: { type: object, properties: { path: { type: string }, method: { type: string }, response: { type: string }, status: { type: number } } } }
      required: [port, routes]
  - name: generate_api
    description: Generate a REST API from a schema or description
    permissions: [code.execute, filesystem.write]
    inputSchema:
      type: object
      properties:
        description: { type: string }
        framework: { type: string, enum: [express, fastify, hono, flask, fastapi] }
        outputDir: { type: string }
      required: [description, framework, outputDir]
triggers:
  - type: keyword
    pattern: api
    priority: 5
  - type: keyword
    pattern: curl
    priority: 7
  - type: keyword
    pattern: http request
    priority: 7
  - type: keyword
    pattern: endpoint
    priority: 5
---

# API Builder Skill

Build, test, and mock REST APIs.

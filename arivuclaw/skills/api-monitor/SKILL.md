---
name: api-monitor
version: 1.0.0
description: Monitors API health, uptime, response times, and alerts on degradation or outages.
author: ArivuClaw
tags:
  - devops
  - monitoring
  - api
  - uptime
permissions:
  - network_access
  - read_files
  - write_files
tools:
  - name: check_endpoint
    description: Performs a health check on a single API endpoint.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: The API endpoint URL to check.
        method:
          type: string
          enum: [GET, POST, PUT, DELETE, HEAD]
          default: GET
        headers:
          type: object
          description: Custom headers to include in the request.
        expected_status:
          type: integer
          description: Expected HTTP status code.
          default: 200
        timeout_ms:
          type: integer
          description: Request timeout in milliseconds.
          default: 5000
      required:
        - url
  - name: monitor_endpoints
    description: Sets up recurring monitoring for a list of API endpoints.
    permissions:
      - network_access
      - write_files
    inputSchema:
      type: object
      properties:
        endpoints:
          type: array
          items:
            type: object
            properties:
              url:
                type: string
              method:
                type: string
              name:
                type: string
          description: List of endpoints to monitor.
        interval_seconds:
          type: integer
          description: Polling interval in seconds.
          default: 60
        alert_on:
          type: array
          items:
            type: string
            enum: [downtime, slow_response, status_change, error_rate]
          description: Conditions that trigger alerts.
      required:
        - endpoints
  - name: get_status_report
    description: Returns a summary report of all monitored endpoints.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        time_range:
          type: string
          enum: [1h, 6h, 24h, 7d, 30d]
          default: 24h
        format:
          type: string
          enum: [summary, detailed, json]
          default: summary
      required: []
triggers:
  - pattern: "check api {url}"
  - pattern: "monitor endpoint {url}"
  - pattern: "api status report"
  - pattern: "is {service} up"
---

# API Monitor

Monitors API health, uptime, and response times. Sends alerts on degradation, outages, or unexpected status changes.

## Usage

```
check api https://api.example.com/health
monitor endpoint https://api.example.com/v1/users
api status report
is payment-service up
```

## Features

- Single endpoint health checks with configurable expectations
- Recurring monitoring with customizable intervals
- Alerts on downtime, slow responses, status changes, error rates
- Status reports over configurable time ranges

---
name: heartbeat-monitor
version: "1.0.0"
description: Background health checks and recurring monitoring for pinging URLs, checking services, and alerting on failures.
author: ArivuClaw
tags: [monitoring, health, heartbeat, uptime, alerts]
permissions: [network.fetch, filesystem.write]
tools:
  - name: heartbeat_add
    description: Add a new endpoint or service to monitor with a health check
    permissions: [network.fetch, filesystem.write]
    inputSchema:
      type: object
      properties:
        name: { type: string, description: "Friendly name for this monitor" }
        url: { type: string, description: "URL or endpoint to monitor" }
        interval: { type: number, description: "Check interval in seconds" }
        method: { type: string, enum: [GET, POST, HEAD], description: "HTTP method to use" }
        expected_status: { type: number, description: "Expected HTTP status code" }
        timeout: { type: number, description: "Request timeout in milliseconds" }
      required: [name, url, interval]
  - name: heartbeat_list
    description: List all configured monitors and their current status
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        filter: { type: string, enum: [all, healthy, unhealthy, paused], description: "Filter monitors by status" }
        sort_by: { type: string, enum: [name, status, last_check], description: "Sort order for the list" }
      required: []
  - name: heartbeat_remove
    description: Remove a monitor by name or ID
    permissions: [filesystem.write]
    inputSchema:
      type: object
      properties:
        name: { type: string, description: "Name of the monitor to remove" }
        confirm: { type: boolean, description: "Confirm the removal" }
      required: [name]
  - name: heartbeat_status
    description: Get detailed status and history for a specific monitor
    permissions: [filesystem.read, network.fetch]
    inputSchema:
      type: object
      properties:
        name: { type: string, description: "Name of the monitor to check" }
        history_count: { type: number, description: "Number of recent checks to include" }
        include_response_times: { type: boolean, description: "Whether to include response time metrics" }
      required: [name]
triggers:
  - type: keyword
    pattern: "monitor|heartbeat|health check|uptime|ping|status check"
    priority: 6
---

# Heartbeat Monitor

You are a service health monitoring assistant.

Help the user set up and manage health checks for their services and endpoints. When adding monitors, suggest sensible defaults for intervals and timeouts. Present status information with clear indicators for healthy and unhealthy services. When reporting failures, include response times, error codes, and timestamps. Suggest alert thresholds based on the service type. Always show uptime percentages when displaying historical data.

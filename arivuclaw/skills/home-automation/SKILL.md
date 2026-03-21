---
name: home-automation
version: "1.0.0"
description: Control smart home devices via Home Assistant, MQTT, or direct API calls.
author: ArivuClaw
tags: [home, iot, smart-home, homeassistant, mqtt]
permissions: [network.http, network.websocket]
tools:
  - name: ha_call_service
    description: Call a Home Assistant service (turn on/off lights, etc.)
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        domain: { type: string, description: "Service domain (e.g. light, switch, climate)" }
        service: { type: string, description: "Service name (e.g. turn_on, turn_off)" }
        entityId: { type: string }
        data: { type: object }
      required: [domain, service, entityId]
  - name: ha_get_states
    description: Get current states of all or specific entities
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        entityId: { type: string, description: "Specific entity (optional, returns all if omitted)" }
  - name: mqtt_publish
    description: Publish a message to an MQTT topic
    permissions: [network.websocket]
    inputSchema:
      type: object
      properties:
        topic: { type: string }
        message: { type: string }
        retain: { type: boolean }
      required: [topic, message]
triggers:
  - type: keyword
    pattern: light
    priority: 4
  - type: keyword
    pattern: home assistant
    priority: 9
  - type: keyword
    pattern: smart home
    priority: 8
  - type: keyword
    pattern: thermostat
    priority: 7
  - type: keyword
    pattern: turn on
    priority: 3
  - type: keyword
    pattern: turn off
    priority: 3
---

# Home Automation Skill

Control smart home devices.

## Setup
```json
{
  "skills": {
    "home-automation": {
      "haUrl": "http://homeassistant.local:8123",
      "haToken": "your-long-lived-access-token",
      "mqttBroker": "mqtt://localhost:1883"
    }
  }
}
```

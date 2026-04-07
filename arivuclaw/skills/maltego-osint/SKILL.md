---
name: maltego-osint
version: "1.0.0"
description: "OSINT and link analysis. Discover relationships between people, domains, IPs, and organizations."
author: ArivuClaw
tags:
  - maltego
  - osint
  - intel
  - graph
  - recon
permissions:
  - network.http
  - system.process
tools:
  - name: maltego_transform
    description: "Run a Maltego transform on an entity"
    inputSchema:
      type: object
      required:
        - entity
      properties:
        entity:
          type: string
          description: "Entity value to transform (e.g. a domain, IP, or email address)"
        entityType:
          type: string
          enum:
            - domain
            - ip
            - email
            - person
            - phone
            - org
          description: "Type of the input entity"
        transform:
          type: string
          description: "Specific transform to run"
  - name: maltego_graph
    description: "Build a relationship graph from seed entities"
    inputSchema:
      type: object
      required:
        - seed
      properties:
        seed:
          type: string
          description: "Seed entity to start graph building from"
        depth:
          type: number
          description: "How many levels deep to expand the graph"
        entityTypes:
          type: array
          items:
            type: string
          description: "Entity types to include in the graph"
  - name: maltego_export
    description: "Export investigation results"
    inputSchema:
      type: object
      properties:
        format:
          type: string
          enum:
            - csv
            - json
            - graphml
            - pdf
          description: "Export format"
        workspace:
          type: string
          description: "Workspace to export from"
triggers:
  - type: keyword
    pattern: "maltego"
    priority: 9
  - type: keyword
    pattern: "osint graph"
    priority: 7
---

# Maltego OSINT

OSINT and link analysis skill for discovering relationships between people, domains, IPs, and organizations.

## Usage

Use this skill to run Maltego transforms, build relationship graphs, and export investigation results.

### Tools

- **maltego_transform** -- Run a Maltego transform on a given entity to discover related entities. Specify the entity type and an optional transform name.
- **maltego_graph** -- Build a multi-level relationship graph starting from a seed entity. Control depth and filter by entity types.
- **maltego_export** -- Export investigation results in CSV, JSON, GraphML, or PDF format.

### Examples

1. Run a transform on a domain:
   ```
   maltego_transform entity="example.com" entityType="domain"
   ```

2. Build a relationship graph from an email:
   ```
   maltego_graph seed="user@example.com" depth=3 entityTypes=["domain", "ip", "person"]
   ```

3. Export results as JSON:
   ```
   maltego_export format="json" workspace="investigation-1"
   ```

### Notes

- Some transforms require API keys or a Maltego license.
- Deep graph expansions can produce large amounts of data; use depth and entity type filters to focus results.
- Ensure you have authorization before investigating any target.

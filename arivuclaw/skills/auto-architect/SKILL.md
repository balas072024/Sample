---
name: auto-architect
version: "1.0.0"
description: >
  AI software architect — design system architectures, generate diagrams,
  create project structures, recommend tech stacks, produce design docs.
author: ArivuClaw
tags:
  - architecture
  - design
  - system
  - diagram
  - tech-stack
permissions:
  - filesystem.read
  - filesystem.write
  - network.http
  - memory.read
  - memory.write
  - unrestricted
tools:
  - name: architect_design
    description: Design a system architecture from requirements.
    inputSchema:
      type: object
      required:
        - requirements
      properties:
        requirements:
          type: string
          description: System requirements in natural language.
        type:
          type: string
          enum:
            - microservices
            - monolith
            - serverless
            - event-driven
            - layered
          description: Architecture pattern type.
        scale:
          type: string
          enum:
            - small
            - medium
            - large
            - enterprise
          description: Expected scale of the system.
        outputFormat:
          type: string
          enum:
            - markdown
            - mermaid
            - json
          description: Output format for the architecture design.
  - name: architect_diagram
    description: Generate architecture diagrams.
    inputSchema:
      type: object
      required:
        - description
      properties:
        description:
          type: string
          description: Description of the diagram to generate.
        diagramType:
          type: string
          enum:
            - system
            - sequence
            - class
            - er
            - flow
            - deployment
          description: Type of architecture diagram.
        format:
          type: string
          enum:
            - mermaid
            - plantuml
            - ascii
          description: Diagram output format.
        outputPath:
          type: string
          description: File path to write the diagram.
  - name: architect_scaffold
    description: Generate a complete project structure.
    inputSchema:
      type: object
      required:
        - projectName
        - language
        - outputDir
      properties:
        projectName:
          type: string
          description: Name of the project.
        type:
          type: string
          enum:
            - web-app
            - api
            - cli
            - library
            - monorepo
            - microservice
          description: Type of project to scaffold.
        language:
          type: string
          description: Primary programming language.
        framework:
          type: string
          description: Framework to use (e.g., nextjs, express, fastapi).
        features:
          type: array
          items:
            type: string
          description: Features to include in the scaffold.
        outputDir:
          type: string
          description: Directory to generate the project in.
  - name: architect_tech_stack
    description: Recommend a tech stack based on requirements.
    inputSchema:
      type: object
      required:
        - requirements
      properties:
        requirements:
          type: string
          description: Project requirements in natural language.
        constraints:
          type: object
          description: Constraints such as budget, team size, timeline.
        preferences:
          type: object
          description: Preferences such as preferred languages or cloud providers.
  - name: architect_review
    description: Review existing architecture for issues.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        projectPath:
          type: string
          description: Root path of the project to review.
        focusAreas:
          type: array
          items:
            type: string
            enum:
              - scalability
              - security
              - performance
              - maintainability
              - cost
          description: Areas to focus the review on.
triggers:
  - type: keyword
    pattern: "architect"
    priority: 8
  - type: keyword
    pattern: "design system"
    priority: 7
  - type: keyword
    pattern: "tech stack"
    priority: 7
  - type: keyword
    pattern: "scaffold"
    priority: 7
---

# auto-architect

AI software architect skill for ArivuClaw. Design system architectures, generate
diagrams, scaffold projects, recommend tech stacks, and review existing designs.

## Usage

### Design Architecture

Provide system requirements and receive a complete architecture design.

```
architect_design({
  requirements: "E-commerce platform with 100k daily users, real-time inventory, payment processing",
  type: "microservices",
  scale: "large",
  outputFormat: "markdown"
})
```

### Generate Diagrams

Create architecture diagrams in various formats.

```
architect_diagram({
  description: "User authentication flow with OAuth2 and MFA",
  diagramType: "sequence",
  format: "mermaid",
  outputPath: "docs/auth-flow.md"
})
```

### Scaffold Projects

Generate a complete, production-ready project structure.

```
architect_scaffold({
  projectName: "payment-service",
  type: "microservice",
  language: "go",
  framework: "gin",
  features: ["grpc", "postgres", "redis", "docker"],
  outputDir: "/workspace/payment-service"
})
```

### Recommend Tech Stack

Get data-driven tech stack recommendations.

```
architect_tech_stack({
  requirements: "Real-time collaborative document editor with offline support",
  constraints: { teamSize: 5, timeline: "6 months" },
  preferences: { cloud: "aws" }
})
```

### Review Architecture

Analyze an existing project for architectural issues.

```
architect_review({
  projectPath: "/workspace/my-app",
  focusAreas: ["scalability", "security", "performance"]
})
```

## Instructions

1. When designing architectures, consider non-functional requirements such as scalability, security, and cost.
2. Always produce diagrams that are self-explanatory with proper labels and legends.
3. Scaffold projects should include configuration files, CI/CD templates, and Docker support.
4. Tech stack recommendations must include trade-off analysis and justification.
5. Architecture reviews should provide actionable remediation steps for each issue found.
6. Respect existing project conventions when reviewing or extending architectures.

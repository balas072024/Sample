---
name: deployment-watcher
version: 1.0.0
description: Monitors CI/CD deployments, tracks pipeline status, and alerts on failures or rollbacks.
author: Arivumaiyam AI
tags:
  - devops
  - ci-cd
  - deployment
  - monitoring
permissions:
  - network_access
  - read_files
tools:
  - name: watch_pipeline
    description: Monitors a CI/CD pipeline run and reports status changes.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        provider:
          type: string
          enum: [github-actions, gitlab-ci, jenkins, circleci, bitbucket]
          description: CI/CD provider.
        repo:
          type: string
          description: Repository identifier (owner/repo).
        run_id:
          type: string
          description: Specific pipeline run ID. Watches latest if omitted.
        branch:
          type: string
          description: Branch to watch deployments for.
          default: main
      required:
        - provider
        - repo
  - name: get_deploy_status
    description: Returns the current deployment status for a service or environment.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        environment:
          type: string
          enum: [development, staging, production]
          description: Target deployment environment.
        service:
          type: string
          description: Service name to check.
      required:
        - environment
  - name: list_recent_deploys
    description: Lists recent deployments with their status and metadata.
    permissions:
      - network_access
      - read_files
    inputSchema:
      type: object
      properties:
        repo:
          type: string
          description: Repository identifier.
        environment:
          type: string
          enum: [development, staging, production, all]
          default: all
        limit:
          type: integer
          description: Number of recent deployments to list.
          default: 10
      required:
        - repo
triggers:
  - pattern: "watch deployment {repo}"
  - pattern: "deploy status for {service}"
  - pattern: "list recent deploys"
  - pattern: "is {branch} deployed"
---

# Deployment Watcher

Monitors CI/CD deployments, tracks pipeline status, and alerts on failures or rollbacks across multiple providers.

## Usage

```
watch deployment myorg/api-server
deploy status for auth-service
list recent deploys
is release/v2.1 deployed
```

## Features

- Multi-provider support: GitHub Actions, GitLab CI, Jenkins, CircleCI, Bitbucket
- Real-time pipeline status monitoring
- Environment-specific deployment tracking
- Recent deployment history with metadata

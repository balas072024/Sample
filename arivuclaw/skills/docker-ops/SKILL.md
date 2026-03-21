---
name: docker-ops
version: "1.0.0"
description: Manage Docker containers, images, volumes, and docker-compose stacks.
author: Arivumaiyam AI
tags:
  - docker
  - containers
  - devops
  - compose
permissions:
  - docker.manage
  - system.process
  - code.execute
environment:
  binaries: [docker]
tools:
  - name: docker_ps
    description: List running containers
    permissions: [docker.manage]
    inputSchema:
      type: object
      properties:
        all: { type: boolean, description: "Include stopped containers" }
  - name: docker_run
    description: Run a new container
    permissions: [docker.manage, system.process]
    inputSchema:
      type: object
      properties:
        image: { type: string }
        name: { type: string }
        ports: { type: array, items: { type: string }, description: "Port mappings (e.g. 8080:80)" }
        env: { type: object, description: "Environment variables" }
        volumes: { type: array, items: { type: string } }
        detach: { type: boolean }
        command: { type: string }
      required: [image]
  - name: docker_stop
    description: Stop a running container
    permissions: [docker.manage]
    inputSchema:
      type: object
      properties:
        container: { type: string }
      required: [container]
  - name: docker_logs
    description: View container logs
    permissions: [docker.manage]
    inputSchema:
      type: object
      properties:
        container: { type: string }
        tail: { type: number }
        follow: { type: boolean }
      required: [container]
  - name: docker_build
    description: Build a Docker image from Dockerfile
    permissions: [docker.manage, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string, description: "Build context path" }
        tag: { type: string }
        dockerfile: { type: string }
      required: [path, tag]
  - name: docker_compose
    description: Run docker-compose commands
    permissions: [docker.manage, system.process]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [up, down, ps, logs, restart, build] }
        file: { type: string, description: "Compose file path" }
        services: { type: array, items: { type: string } }
      required: [action]
  - name: docker_images
    description: List Docker images
    permissions: [docker.manage]
    inputSchema:
      type: object
      properties: {}
  - name: docker_exec
    description: Execute a command inside a running container
    permissions: [docker.manage, code.execute]
    inputSchema:
      type: object
      properties:
        container: { type: string }
        command: { type: string }
      required: [container, command]
triggers:
  - type: keyword
    pattern: docker
    priority: 9
  - type: keyword
    pattern: container
    priority: 7
  - type: keyword
    pattern: compose
    priority: 7
---

# Docker Operations Skill

Full Docker management — containers, images, volumes, and docker-compose.

## Requirements
- Docker must be installed and accessible
- User must be in the `docker` group (or use unrestricted mode for sudo)

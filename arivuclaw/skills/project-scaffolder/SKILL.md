---
name: project-scaffolder
version: "1.0.0"
description: >
  Generate complete project scaffolds — from fullstack web apps to CLI tools,
  libraries, microservices, with CI/CD, tests, linting, Docker.
author: ArivuClaw
tags:
  - scaffold
  - boilerplate
  - project
  - template
  - starter
permissions:
  - filesystem.write
  - code.execute
  - system.process
  - git.ops
  - unrestricted
tools:
  - name: scaffold_project
    description: Generate a complete project from a template with selected features.
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: The name of the project.
        type:
          type: string
          enum:
            - fullstack-web
            - api
            - cli
            - library
            - monorepo
            - microservice
            - mobile
            - desktop
            - browser-extension
          description: The type of project to scaffold.
        language:
          type: string
          description: The primary programming language (e.g., typescript, python, rust, go).
        framework:
          type: string
          description: The framework to use (e.g., next, express, django, fastapi).
        features:
          type: array
          items:
            type: string
            enum:
              - auth
              - database
              - testing
              - ci-cd
              - docker
              - linting
              - formatting
              - monitoring
              - logging
          description: Features to include in the scaffold.
        outputDir:
          type: string
          description: The directory to output the scaffolded project.
      required:
        - name
        - language
        - outputDir

  - name: scaffold_component
    description: Generate a component or module within an existing project.
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: The name of the component/module.
        type:
          type: string
          enum:
            - component
            - service
            - controller
            - model
            - middleware
            - hook
            - util
          description: The type of component to generate.
        projectPath:
          type: string
          description: Path to the existing project.
      required:
        - name
        - projectPath

  - name: scaffold_fullstack
    description: Generate a fullstack application with frontend, backend, and database.
    inputSchema:
      type: object
      properties:
        name:
          type: string
          description: The name of the fullstack application.
        frontend:
          type: string
          enum:
            - react
            - vue
            - svelte
            - next
            - nuxt
            - angular
          description: The frontend framework.
        backend:
          type: string
          enum:
            - express
            - fastify
            - nest
            - django
            - fastapi
            - rails
            - spring
          description: The backend framework.
        database:
          type: string
          enum:
            - postgres
            - mysql
            - mongodb
            - sqlite
          description: The database to use.
        features:
          type: array
          items:
            type: string
          description: Additional features to include.
        outputDir:
          type: string
          description: The directory to output the scaffolded application.
      required:
        - name
        - outputDir

triggers:
  - type: keyword
    pattern: "scaffold"
    priority: 8
  - type: keyword
    pattern: "new project"
    priority: 7
  - type: keyword
    pattern: "boilerplate"
    priority: 7
  - type: keyword
    pattern: "create app"
    priority: 6
---

# Project Scaffolder

The **project-scaffolder** skill enables ArivuClaw to generate complete, production-ready project scaffolds with best practices baked in.

## How It Works

1. **Project Scaffold** — Use `scaffold_project` to generate a complete project with your chosen language, framework, and features. Includes proper directory structure, configuration files, and tooling.
2. **Component Generation** — Use `scaffold_component` to add new components, services, controllers, models, middleware, hooks, or utilities to an existing project following its conventions.
3. **Fullstack Generation** — Use `scaffold_fullstack` to generate a complete fullstack application with a frontend, backend, and database all wired together.

## What Gets Generated

- Project structure following community conventions
- Package configuration (package.json, pyproject.toml, Cargo.toml, etc.)
- Linting and formatting configuration (ESLint, Prettier, Ruff, etc.)
- Testing setup with example tests
- CI/CD pipeline configuration
- Docker and docker-compose files
- Environment variable templates
- Git configuration (.gitignore, hooks)
- README with setup instructions

## Usage Examples

- "Scaffold a new TypeScript API with Express, testing, and Docker"
- "Create a new fullstack app with Next.js, FastAPI, and Postgres"
- "Generate a new React component called UserProfile"
- "Set up a new Rust CLI project with CI/CD"

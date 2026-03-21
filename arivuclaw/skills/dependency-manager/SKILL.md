---
name: dependency-manager
version: "1.0.0"
description: >
  Intelligent dependency management — update, audit, resolve conflicts,
  find alternatives, license compliance, size analysis.
author: Arivumaiyam AI
tags:
  - dependencies
  - npm
  - pip
  - cargo
  - update
  - audit
  - license
permissions:
  - code.execute
  - filesystem.read
  - filesystem.write
  - network.http
  - system.process
  - unrestricted
tools:
  - name: deps_audit
    description: Audit dependencies for known vulnerabilities and optionally apply fixes.
    inputSchema:
      type: object
      properties:
        projectPath:
          type: string
          description: Path to the project to audit.
        fix:
          type: boolean
          description: Whether to automatically fix vulnerabilities.
        severity:
          type: string
          enum:
            - all
            - critical
            - high
          description: Minimum severity level to report.
      required:
        - projectPath

  - name: deps_update
    description: Update dependencies intelligently using a specified strategy.
    inputSchema:
      type: object
      properties:
        projectPath:
          type: string
          description: Path to the project to update.
        strategy:
          type: string
          enum:
            - latest
            - minor
            - patch
            - security-only
          description: Update strategy to apply.
        dryRun:
          type: boolean
          description: Preview changes without applying them.
        interactive:
          type: boolean
          description: Prompt for confirmation on each update.
      required:
        - projectPath

  - name: deps_analyze
    description: Analyze the dependency tree with optional size and license information.
    inputSchema:
      type: object
      properties:
        projectPath:
          type: string
          description: Path to the project to analyze.
        format:
          type: string
          enum:
            - tree
            - flat
            - json
          description: Output format for the analysis.
        showSize:
          type: boolean
          description: Include package size information.
        showLicense:
          type: boolean
          description: Include license information.
      required:
        - projectPath

  - name: deps_find_alternative
    description: Find alternative packages based on specified criteria.
    inputSchema:
      type: object
      properties:
        packageName:
          type: string
          description: The package to find alternatives for.
        criteria:
          type: array
          items:
            type: string
            enum:
              - maintained
              - popular
              - lightweight
              - type-safe
          description: Criteria for evaluating alternatives.
      required:
        - packageName

  - name: deps_license
    description: Check license compliance across all dependencies.
    inputSchema:
      type: object
      properties:
        projectPath:
          type: string
          description: Path to the project to check.
        allowed:
          type: array
          items:
            type: string
          description: List of allowed license identifiers (e.g., MIT, Apache-2.0).
        denied:
          type: array
          items:
            type: string
          description: List of denied license identifiers (e.g., GPL-3.0).
        outputFormat:
          type: string
          enum:
            - table
            - json
            - csv
          description: Output format for the compliance report.
      required:
        - projectPath

  - name: deps_unused
    description: Find unused dependencies in the project and optionally remove them.
    inputSchema:
      type: object
      properties:
        projectPath:
          type: string
          description: Path to the project to check.
        remove:
          type: boolean
          description: Whether to automatically remove unused dependencies.
      required:
        - projectPath

triggers:
  - type: keyword
    pattern: "dependencies"
    priority: 6
  - type: keyword
    pattern: "update packages"
    priority: 7
  - type: keyword
    pattern: "audit deps"
    priority: 7
  - type: keyword
    pattern: "npm audit"
    priority: 8
---

# Dependency Manager

The **dependency-manager** skill provides Arivumaiyam AI with intelligent dependency management capabilities across multiple package ecosystems.

## How It Works

1. **Audit** — Use `deps_audit` to scan dependencies for known vulnerabilities. Optionally auto-fix issues and filter by severity.
2. **Update** — Use `deps_update` to update dependencies with strategies ranging from conservative (patch-only) to aggressive (latest). Supports dry runs for safety.
3. **Analyze** — Use `deps_analyze` to visualize the dependency tree, including size and license information for each package.
4. **Find Alternatives** — Use `deps_find_alternative` to discover replacement packages that are better maintained, more popular, lighter, or type-safe.
5. **License Compliance** — Use `deps_license` to verify all dependencies comply with your allowed/denied license policy.
6. **Unused Detection** — Use `deps_unused` to identify and optionally remove dependencies that are no longer referenced in your code.

## Supported Ecosystems

- **Node.js** — npm, yarn, pnpm (package.json)
- **Python** — pip, poetry, pipenv (requirements.txt, pyproject.toml)
- **Rust** — cargo (Cargo.toml)
- **Go** — go modules (go.mod)
- **Ruby** — bundler (Gemfile)
- **Java** — maven, gradle (pom.xml, build.gradle)

## Usage Examples

- "Audit this project for critical vulnerabilities and fix them"
- "Update all dependencies to their latest minor versions"
- "Find a lightweight alternative to moment.js"
- "Check if all dependencies have MIT-compatible licenses"
- "Remove unused dependencies from the project"

---
name: auto-reviewer
version: "1.0.0"
description: >
  Autonomous code review AI — review PRs, enforce standards, detect anti-patterns,
  security issues, suggest improvements with auto-fix.
author: Arivumaiyam AI
tags:
  - review
  - code-quality
  - standards
  - lint
  - security
  - pr
permissions:
  - filesystem.read
  - filesystem.write
  - git.ops
  - network.http
  - unrestricted
tools:
  - name: review_code
    description: Review code for quality, bugs, and security.
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: File path, directory path, or PR URL to review.
        rules:
          type: array
          items:
            type: string
            enum:
              - bugs
              - security
              - performance
              - style
              - complexity
              - duplication
          description: Review rules to apply.
        severity:
          type: string
          enum:
            - all
            - critical
            - high
            - medium
          description: Minimum severity level to report.
        autoFix:
          type: boolean
          description: Automatically fix issues where possible.
  - name: review_pr
    description: Review a GitHub/GitLab pull request.
    inputSchema:
      type: object
      required:
        - prUrl
      properties:
        prUrl:
          type: string
          description: URL of the pull request to review.
        focusAreas:
          type: array
          items:
            type: string
          description: Specific areas to focus the review on.
        commentInline:
          type: boolean
          description: Leave inline comments on the PR.
        approve:
          type: boolean
          description: Approve the PR if no critical issues are found.
  - name: review_standards
    description: Check code against project standards.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        projectPath:
          type: string
          description: Root path of the project.
        configPath:
          type: string
          description: Path to the standards configuration file.
        fix:
          type: boolean
          description: Automatically fix standards violations.
  - name: review_complexity
    description: Analyze code complexity metrics.
    inputSchema:
      type: object
      required:
        - path
      properties:
        path:
          type: string
          description: File or directory to analyze.
        threshold:
          type: number
          description: Complexity threshold to flag.
        format:
          type: string
          enum:
            - table
            - json
            - markdown
          description: Output format for the complexity report.
  - name: review_duplication
    description: Detect code duplication.
    inputSchema:
      type: object
      required:
        - path
      properties:
        path:
          type: string
          description: File or directory to scan for duplication.
        minLines:
          type: number
          description: Minimum number of lines to consider as duplication.
        language:
          type: string
          description: Programming language filter.
triggers:
  - type: keyword
    pattern: "review"
    priority: 5
  - type: keyword
    pattern: "code review"
    priority: 8
  - type: keyword
    pattern: "check code"
    priority: 6
  - type: keyword
    pattern: "pr review"
    priority: 8
---

# auto-reviewer

Autonomous code review AI skill for Arivumaiyam AI. Review pull requests, enforce
coding standards, detect anti-patterns and security issues, and suggest
improvements with auto-fix capabilities.

## Usage

### Review Code

Review files or directories for quality, bugs, and security issues.

```
review_code({
  target: "src/services/",
  rules: ["bugs", "security", "performance", "complexity"],
  severity: "high",
  autoFix: false
})
```

### Review Pull Request

Analyze a PR and leave inline comments.

```
review_pr({
  prUrl: "https://github.com/org/repo/pull/42",
  focusAreas: ["security", "error-handling"],
  commentInline: true,
  approve: false
})
```

### Check Standards

Enforce project coding standards.

```
review_standards({
  projectPath: "/workspace/my-app",
  configPath: ".codestandards.yml",
  fix: true
})
```

### Analyze Complexity

Measure cyclomatic complexity and other metrics.

```
review_complexity({
  path: "src/",
  threshold: 10,
  format: "table"
})
```

### Detect Duplication

Find duplicated code blocks across the codebase.

```
review_duplication({
  path: "src/",
  minLines: 6,
  language: "typescript"
})
```

## Instructions

1. When reviewing PRs, check for correctness, security, performance, and maintainability.
2. Inline comments should be specific, actionable, and include suggested fixes.
3. Respect existing project conventions and linting rules.
4. For auto-fix, only apply safe transformations that preserve behavior.
5. Complexity analysis should flag functions exceeding the threshold with refactoring suggestions.
6. Duplication detection should group related duplicates and suggest extraction strategies.

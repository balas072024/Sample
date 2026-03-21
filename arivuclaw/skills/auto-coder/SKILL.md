---
name: auto-coder
version: "1.0.0"
description: >
  Autonomous AI code generation — write complete features, functions, classes,
  and modules from natural language descriptions. Multi-language support with
  context-aware generation.
author: Arivumaiyam AI
tags:
  - code
  - generate
  - autonomous
  - ai
  - multi-language
permissions:
  - code.execute
  - filesystem.read
  - filesystem.write
  - memory.read
  - unrestricted
tools:
  - name: auto_code_generate
    description: Generate code from a natural language description.
    inputSchema:
      type: object
      required:
        - description
      properties:
        description:
          type: string
          description: Natural language description of the code to generate.
        language:
          type: string
          enum:
            - typescript
            - python
            - rust
            - go
            - java
            - cpp
            - csharp
            - ruby
            - php
            - swift
            - kotlin
          description: Target programming language.
        outputPath:
          type: string
          description: File path to write the generated code.
        context:
          type: string
          description: Related code for context-aware generation.
        style:
          type: string
          enum:
            - minimal
            - documented
            - enterprise
          description: Code style preference.
        tests:
          type: boolean
          description: Also generate tests alongside the code.
  - name: auto_code_complete
    description: Complete partial code at a given cursor position.
    inputSchema:
      type: object
      required:
        - filePath
      properties:
        filePath:
          type: string
          description: Path to the file containing partial code.
        cursorLine:
          type: number
          description: Line number where completion should occur.
        instruction:
          type: string
          description: Instruction for how to complete the code.
  - name: auto_code_fix
    description: Fix broken code automatically.
    inputSchema:
      type: object
      required:
        - filePath
      properties:
        filePath:
          type: string
          description: Path to the file with broken code.
        errorMessage:
          type: string
          description: Error message or compiler output to guide the fix.
        autoApply:
          type: boolean
          description: Automatically apply the fix without confirmation.
  - name: auto_code_explain
    description: Explain code in natural language.
    inputSchema:
      type: object
      required:
        - filePath
      properties:
        filePath:
          type: string
          description: Path to the file to explain.
        startLine:
          type: number
          description: Start line of the code range to explain.
        endLine:
          type: number
          description: End line of the code range to explain.
        detail:
          type: string
          enum:
            - brief
            - detailed
            - eli5
          description: Level of detail for the explanation.
  - name: auto_implement_feature
    description: Implement a complete feature across multiple files.
    inputSchema:
      type: object
      required:
        - description
        - projectPath
      properties:
        description:
          type: string
          description: Natural language description of the feature to implement.
        projectPath:
          type: string
          description: Root path of the project.
        branch:
          type: string
          description: Git branch to create for the feature.
        createPR:
          type: boolean
          description: Create a pull request after implementation.
triggers:
  - type: keyword
    pattern: "generate code"
    priority: 8
  - type: keyword
    pattern: "write code"
    priority: 7
  - type: keyword
    pattern: "implement"
    priority: 5
  - type: keyword
    pattern: "auto code"
    priority: 9
---

# auto-coder

Autonomous AI code generation skill for Arivumaiyam AI. Write complete features,
functions, classes, and modules from natural language descriptions with
multi-language support and context-aware generation.

## Usage

### Generate Code

Provide a natural language description and the skill will generate production-ready
code in your target language. Supply related code as context for better results.

```
auto_code_generate({
  description: "REST API endpoint for user authentication with JWT",
  language: "typescript",
  outputPath: "src/auth/controller.ts",
  style: "documented",
  tests: true
})
```

### Complete Partial Code

Point the skill at an incomplete file and it will intelligently complete the code
based on surrounding context and optional instructions.

```
auto_code_complete({
  filePath: "src/services/payment.ts",
  cursorLine: 42,
  instruction: "implement the payment processing logic using Stripe"
})
```

### Fix Broken Code

Provide a file and error message to automatically diagnose and fix code issues.

```
auto_code_fix({
  filePath: "src/utils/parser.ts",
  errorMessage: "TypeError: Cannot read property 'map' of undefined",
  autoApply: true
})
```

### Explain Code

Get natural language explanations of code at varying levels of detail.

```
auto_code_explain({
  filePath: "src/algorithms/sort.rs",
  startLine: 10,
  endLine: 45,
  detail: "detailed"
})
```

### Implement Feature

Describe a feature and the skill will implement it across multiple files,
optionally creating a branch and pull request.

```
auto_implement_feature({
  description: "Add OAuth2 social login with Google and GitHub providers",
  projectPath: "/workspace/my-app",
  branch: "feature/social-login",
  createPR: true
})
```

## Instructions

1. When generating code, always respect the project's existing style and conventions.
2. Use the `context` parameter to supply related code for more accurate generation.
3. When `tests` is enabled, generate tests that cover edge cases and error paths.
4. For feature implementation, analyze the existing project structure before writing code.
5. Always validate generated code for syntax correctness before writing to disk.
6. Prefer idiomatic patterns for each target language.
7. When fixing code, create a backup unless explicitly told not to.

---
name: auto-tester
version: "1.0.0"
description: >
  Autonomous test generation and execution — unit, integration, e2e tests.
  Mutation testing, coverage analysis, fuzz testing.
author: Arivumaiyam AI
tags:
  - test
  - unit
  - integration
  - e2e
  - coverage
  - mutation
  - fuzz
permissions:
  - code.execute
  - filesystem.read
  - filesystem.write
  - system.process
  - unrestricted
tools:
  - name: test_generate
    description: Auto-generate tests for code.
    inputSchema:
      type: object
      required:
        - filePath
      properties:
        filePath:
          type: string
          description: Path to the source file to generate tests for.
        testType:
          type: string
          enum:
            - unit
            - integration
            - e2e
          description: Type of tests to generate.
        framework:
          type: string
          enum:
            - jest
            - pytest
            - vitest
            - mocha
            - go-test
            - junit
            - rspec
          description: Test framework to use.
        coverage:
          type: boolean
          description: Generate tests targeting full code coverage.
        outputPath:
          type: string
          description: File path to write the generated tests.
  - name: test_run
    description: Run tests with optional coverage reporting.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        command:
          type: string
          description: Custom test command to run.
        projectPath:
          type: string
          description: Root path of the project.
        coverage:
          type: boolean
          description: Enable coverage reporting.
        watch:
          type: boolean
          description: Run tests in watch mode.
        filter:
          type: string
          description: Filter to run specific tests by name or pattern.
  - name: test_coverage
    description: Analyze test coverage and find gaps.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        projectPath:
          type: string
          description: Root path of the project.
        threshold:
          type: number
          description: Coverage percentage threshold.
        format:
          type: string
          enum:
            - text
            - html
            - json
            - lcov
          description: Coverage report output format.
  - name: test_mutation
    description: Run mutation testing to verify test quality.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        projectPath:
          type: string
          description: Root path of the project.
        files:
          type: array
          items:
            type: string
          description: Specific files to run mutation testing on.
        tool:
          type: string
          enum:
            - stryker
            - mutmut
            - pitest
          description: Mutation testing tool to use.
  - name: test_fuzz
    description: Run fuzz testing on functions.
    inputSchema:
      type: object
      required:
        - filePath
        - function
      properties:
        filePath:
          type: string
          description: Path to the file containing the function to fuzz.
        function:
          type: string
          description: Name of the function to fuzz test.
        iterations:
          type: number
          description: Number of fuzz iterations to run.
        seed:
          type: string
          description: Seed for reproducible fuzz testing.
  - name: test_snapshot
    description: Generate and update snapshot tests.
    inputSchema:
      type: object
      required:
        - projectPath
      properties:
        projectPath:
          type: string
          description: Root path of the project.
        update:
          type: boolean
          description: Update existing snapshots.
triggers:
  - type: keyword
    pattern: "test"
    priority: 4
  - type: keyword
    pattern: "generate test"
    priority: 8
  - type: keyword
    pattern: "coverage"
    priority: 6
  - type: keyword
    pattern: "fuzz"
    priority: 7
---

# auto-tester

Autonomous test generation and execution skill for Arivumaiyam AI. Generate unit,
integration, and e2e tests. Run mutation testing, coverage analysis, and fuzz
testing for comprehensive test quality.

## Usage

### Generate Tests

Auto-generate tests for any source file.

```
test_generate({
  filePath: "src/services/payment.ts",
  testType: "unit",
  framework: "jest",
  coverage: true,
  outputPath: "src/services/__tests__/payment.test.ts"
})
```

### Run Tests

Execute tests with coverage reporting.

```
test_run({
  projectPath: "/workspace/my-app",
  coverage: true,
  filter: "payment"
})
```

### Analyze Coverage

Find coverage gaps and uncovered code paths.

```
test_coverage({
  projectPath: "/workspace/my-app",
  threshold: 80,
  format: "html"
})
```

### Mutation Testing

Verify test quality through mutation testing.

```
test_mutation({
  projectPath: "/workspace/my-app",
  files: ["src/services/payment.ts"],
  tool: "stryker"
})
```

### Fuzz Testing

Run fuzz testing to find edge cases and crashes.

```
test_fuzz({
  filePath: "src/utils/parser.ts",
  function: "parseInput",
  iterations: 10000,
  seed: "42"
})
```

### Snapshot Testing

Generate and update snapshot tests.

```
test_snapshot({
  projectPath: "/workspace/my-app",
  update: false
})
```

## Instructions

1. Generated tests should cover happy paths, edge cases, and error conditions.
2. Use the project's existing test framework and conventions when detected.
3. Coverage analysis should identify untested branches and suggest specific test cases.
4. Mutation testing results should highlight weak tests that need strengthening.
5. Fuzz testing should save crashing inputs for reproducible test cases.
6. Avoid generating brittle tests that depend on implementation details.

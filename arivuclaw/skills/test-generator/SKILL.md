---
name: test-generator
version: 1.0.0
description: Auto-generates unit and integration test suites for source code. Supports multiple frameworks and languages.
author: ArivuClaw
tags:
  - development
  - testing
  - unit-tests
  - integration-tests
permissions:
  - read_files
  - write_files
tools:
  - name: generate_tests
    description: Generates a test suite for the specified source file or function.
    permissions:
      - read_files
      - write_files
    inputSchema:
      type: object
      properties:
        file_path:
          type: string
          description: Path to the source file to generate tests for.
        functions:
          type: array
          items:
            type: string
          description: Specific function names to test. Tests all exports if omitted.
        framework:
          type: string
          enum: [jest, pytest, mocha, junit, go-test, rspec, vitest]
          description: Test framework to use. Auto-detected from project config if omitted.
        test_type:
          type: string
          enum: [unit, integration, both]
          description: Type of tests to generate.
          default: unit
        output_path:
          type: string
          description: Path to write the generated test file. Auto-determined if omitted.
      required:
        - file_path
  - name: generate_coverage_report
    description: Analyzes existing tests and identifies untested code paths.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        source_dir:
          type: string
          description: Directory containing source code.
        test_dir:
          type: string
          description: Directory containing test files.
      required:
        - source_dir
triggers:
  - pattern: "generate tests for {file}"
  - pattern: "write unit tests"
  - pattern: "create test suite for {file}"
  - pattern: "check test coverage"
---

# Test Generator

Auto-generates unit and integration test suites for source code. Detects the project's test framework and produces idiomatic, comprehensive tests.

## Usage

```
generate tests for src/utils.ts
write unit tests
create test suite for lib/parser.py
check test coverage
```

## Features

- Multi-framework support: Jest, pytest, Mocha, JUnit, go test, RSpec, Vitest
- Unit and integration test generation
- Automatic framework detection from project configuration
- Coverage gap analysis for existing test suites

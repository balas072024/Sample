---
name: auto-debugger
version: "1.0.0"
description: >
  Autonomous AI debugger — analyze stack traces, find root causes, suggest and
  auto-apply fixes, reproduce bugs, set breakpoints.
author: Arivumaiyam AI
tags:
  - debug
  - fix
  - error
  - stacktrace
  - autonomous
  - root-cause
permissions:
  - code.execute
  - filesystem.read
  - filesystem.write
  - system.process
  - unrestricted
tools:
  - name: debug_analyze
    description: Analyze an error or stack trace and find the root cause.
    inputSchema:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message or stack trace to analyze.
        filePath:
          type: string
          description: Path to the file where the error occurred.
        projectPath:
          type: string
          description: Root path of the project for broader analysis.
        language:
          type: string
          description: Programming language of the codebase.
  - name: debug_fix
    description: Automatically fix a bug.
    inputSchema:
      type: object
      required:
        - filePath
        - error
      properties:
        filePath:
          type: string
          description: Path to the file containing the bug.
        error:
          type: string
          description: Error message or description of the bug.
        autoApply:
          type: boolean
          description: Automatically apply the fix without confirmation.
        createBackup:
          type: boolean
          description: Create a backup of the file before applying the fix.
  - name: debug_reproduce
    description: Attempt to reproduce a bug from a description.
    inputSchema:
      type: object
      required:
        - description
        - projectPath
      properties:
        description:
          type: string
          description: Description of the bug to reproduce.
        projectPath:
          type: string
          description: Root path of the project.
        command:
          type: string
          description: Command to run to trigger the bug.
  - name: debug_bisect
    description: Binary search through git history to find the commit that introduced a bug.
    inputSchema:
      type: object
      required:
        - goodCommit
        - testCommand
      properties:
        goodCommit:
          type: string
          description: Known good commit hash.
        badCommit:
          type: string
          description: Known bad commit hash (defaults to HEAD).
        testCommand:
          type: string
          description: Command that exits 0 if the bug is absent, non-zero if present.
        projectPath:
          type: string
          description: Root path of the git repository.
  - name: debug_memory_leak
    description: Detect memory leaks in a running process.
    inputSchema:
      type: object
      properties:
        pid:
          type: number
          description: Process ID to monitor.
        command:
          type: string
          description: Command to start and monitor for leaks.
        duration:
          type: number
          description: Duration in seconds to monitor.
        outputPath:
          type: string
          description: File path to write the leak report.
  - name: debug_profile
    description: Profile code execution for performance bottlenecks.
    inputSchema:
      type: object
      required:
        - command
      properties:
        command:
          type: string
          description: Command to profile.
        type:
          type: string
          enum:
            - cpu
            - memory
            - io
            - all
          description: Type of profiling to perform.
        duration:
          type: number
          description: Duration in seconds for the profiling session.
        outputPath:
          type: string
          description: File path to write the profiling report.
triggers:
  - type: keyword
    pattern: "debug"
    priority: 7
  - type: keyword
    pattern: "fix bug"
    priority: 8
  - type: keyword
    pattern: "stack trace"
    priority: 7
  - type: keyword
    pattern: "root cause"
    priority: 7
---

# auto-debugger

Autonomous AI debugger skill for Arivumaiyam AI. Analyze stack traces, find root
causes, suggest and auto-apply fixes, reproduce bugs, and profile performance.

## Usage

### Analyze Errors

Provide an error or stack trace to get root cause analysis.

```
debug_analyze({
  error: "TypeError: Cannot read property 'id' of undefined at UserService.getUser (src/services/user.ts:42)",
  projectPath: "/workspace/my-app",
  language: "typescript"
})
```

### Auto-Fix Bugs

Automatically diagnose and fix bugs in code.

```
debug_fix({
  filePath: "src/services/user.ts",
  error: "TypeError: Cannot read property 'id' of undefined",
  autoApply: true,
  createBackup: true
})
```

### Reproduce Bugs

Attempt to reproduce a bug programmatically.

```
debug_reproduce({
  description: "Login fails when email contains a plus sign",
  projectPath: "/workspace/my-app",
  command: "npm test -- --grep 'login'"
})
```

### Git Bisect

Find the exact commit that introduced a bug.

```
debug_bisect({
  goodCommit: "abc1234",
  badCommit: "HEAD",
  testCommand: "npm test -- --grep 'payment'",
  projectPath: "/workspace/my-app"
})
```

### Detect Memory Leaks

Monitor a process for memory leaks.

```
debug_memory_leak({
  command: "node src/server.js",
  duration: 60,
  outputPath: "reports/memory-leak.json"
})
```

### Profile Performance

Profile code execution to find bottlenecks.

```
debug_profile({
  command: "python main.py --process-data",
  type: "cpu",
  duration: 30,
  outputPath: "reports/profile.json"
})
```

## Instructions

1. Always analyze the full stack trace context, not just the top frame.
2. When auto-fixing, create backups by default to allow easy rollback.
3. For bisect operations, validate that the test command works on both good and bad commits first.
4. Memory leak detection should capture heap snapshots at intervals for comparison.
5. Profile results should highlight the top bottlenecks with actionable optimization suggestions.
6. Correlate errors with recent git changes when project path is available.

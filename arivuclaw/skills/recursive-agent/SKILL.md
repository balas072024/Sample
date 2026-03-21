---
name: recursive-agent
version: "1.0.0"
description: >
  Recursive self-improving AI agent — breaks down complex tasks into subtasks,
  executes them recursively, validates results, retries on failure, learns from outcomes.
author: ArivuClaw
tags:
  - recursive
  - agent
  - autonomous
  - self-improving
  - subtask
  - planning
permissions:
  - code.execute
  - filesystem.read
  - filesystem.write
  - network.http
  - memory.read
  - memory.write
  - system.process
  - unrestricted
tools:
  - name: recursive_execute
    description: Execute a complex task recursively by breaking it into subtasks, running each, validating, and retrying on failure.
    inputSchema:
      type: object
      properties:
        task:
          type: string
          description: The complex task to execute recursively.
        maxDepth:
          type: number
          description: Maximum recursion depth.
          default: 5
        maxRetries:
          type: number
          description: Maximum retries per subtask on failure.
          default: 3
        validateResults:
          type: boolean
          description: Whether to validate results after each subtask execution.
        learnFromOutcome:
          type: boolean
          description: Whether to store learnings from the execution outcome.
        timeout:
          type: number
          description: Timeout in milliseconds for the entire recursive execution.
      required:
        - task

  - name: recursive_plan
    description: Break a task into an ordered list of subtasks with dependency information.
    inputSchema:
      type: object
      properties:
        task:
          type: string
          description: The task to decompose into subtasks.
        context:
          type: string
          description: Additional context to inform planning.
        constraints:
          type: array
          items:
            type: string
          description: Constraints to respect during planning.
      required:
        - task

  - name: recursive_validate
    description: Validate the result of a task execution against criteria.
    inputSchema:
      type: object
      properties:
        task:
          type: string
          description: The original task description.
        result:
          type: string
          description: The result to validate.
        criteria:
          type: array
          items:
            type: string
          description: Validation criteria to check against.
      required:
        - task
        - result

  - name: recursive_learn
    description: Store learnings from task execution for future improvement.
    inputSchema:
      type: object
      properties:
        task:
          type: string
          description: The task that was executed.
        outcome:
          type: string
          enum:
            - success
            - failure
            - partial
          description: The outcome of the task execution.
        lessons:
          type: string
          description: Lessons learned from the execution.
        context:
          type: string
          description: Context surrounding the execution.

  - name: recursive_status
    description: Check the status of a running recursive task.
    inputSchema:
      type: object
      properties:
        taskId:
          type: string
          description: The unique identifier of the recursive task.
      required:
        - taskId

triggers:
  - type: keyword
    pattern: "recursive"
    priority: 8
  - type: keyword
    pattern: "break down"
    priority: 5
  - type: keyword
    pattern: "step by step"
    priority: 4
  - type: keyword
    pattern: "autonomous"
    priority: 6
---

# Recursive Agent

The **recursive-agent** skill enables ArivuClaw to tackle complex tasks by recursively decomposing them into manageable subtasks, executing each one, validating results, and learning from outcomes.

## How It Works

1. **Planning** — The agent receives a complex task and breaks it into an ordered list of subtasks using `recursive_plan`. Each subtask may itself be decomposed further, up to `maxDepth` levels.
2. **Execution** — Each subtask is executed via `recursive_execute`. If a subtask is still too complex, it is recursively decomposed again.
3. **Validation** — After execution, results are validated using `recursive_validate` against the provided or inferred criteria.
4. **Retry** — If validation fails, the agent retries the subtask up to `maxRetries` times, adjusting its approach based on previous failures.
5. **Learning** — On completion (success or failure), the agent stores lessons via `recursive_learn` to improve future executions.

## Usage Examples

- "Recursively refactor this entire module to use async/await"
- "Break down the task of building a REST API and execute each step"
- "Autonomously implement this feature step by step"

## Behavior

- The agent will not exceed the configured `maxDepth` to prevent infinite recursion.
- Each subtask is isolated — failure in one does not automatically fail the parent unless all retries are exhausted.
- Learnings persist across sessions via memory permissions and are used to improve future planning and execution.
- Use `recursive_status` to monitor long-running recursive tasks in real time.

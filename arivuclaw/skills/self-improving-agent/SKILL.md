---
name: self-improving-agent
version: "1.0.0"
description: >
  Self-improving AI — monitors its own performance, identifies weaknesses,
  generates improvements to its own skills and prompts, A/B tests changes.
author: ArivuClaw
tags:
  - self-improving
  - meta-learning
  - evolution
  - optimization
permissions:
  - filesystem.read
  - filesystem.write
  - memory.read
  - memory.write
  - code.execute
  - unrestricted
tools:
  - name: self_analyze
    description: Analyze own performance metrics over a given time range.
    inputSchema:
      type: object
      properties:
        timeRange:
          type: string
          description: Time range to analyze (e.g., "7d", "30d", "1h").
        metrics:
          type: array
          items:
            type: string
            enum:
              - accuracy
              - speed
              - token-efficiency
              - user-satisfaction
              - task-completion
          description: Which performance metrics to analyze.

  - name: self_improve_skill
    description: Generate an improved version of an existing skill.
    inputSchema:
      type: object
      properties:
        skillName:
          type: string
          description: The name of the skill to improve.
        feedback:
          type: string
          description: User or system feedback driving the improvement.
        improvementGoal:
          type: string
          description: The specific goal of the improvement.
      required:
        - skillName

  - name: self_improve_prompt
    description: Optimize a system prompt for a target metric.
    inputSchema:
      type: object
      properties:
        currentPrompt:
          type: string
          description: The current system prompt to optimize.
        targetMetric:
          type: string
          enum:
            - accuracy
            - conciseness
            - helpfulness
          description: The metric to optimize the prompt for.
        examples:
          type: array
          items:
            type: string
          description: Example inputs/outputs to guide optimization.
      required:
        - currentPrompt

  - name: self_ab_test
    description: Run an A/B test between two approaches and measure results.
    inputSchema:
      type: object
      properties:
        approachA:
          type: string
          description: Description or implementation of approach A.
        approachB:
          type: string
          description: Description or implementation of approach B.
        testCases:
          type: array
          items:
            type: string
          description: Test cases to run both approaches against.
        metric:
          type: string
          description: The metric to compare results by.
      required:
        - approachA
        - approachB
        - testCases

  - name: self_evolve
    description: Evolve capabilities over time through iterative self-improvement.
    inputSchema:
      type: object
      properties:
        domain:
          type: string
          description: The domain to evolve capabilities in.
        learningRate:
          type: number
          description: How aggressively to evolve (0.0 to 1.0).
        maxIterations:
          type: number
          description: Maximum evolution iterations to run.

triggers:
  - type: keyword
    pattern: "self improve"
    priority: 8
  - type: keyword
    pattern: "evolve"
    priority: 6
  - type: keyword
    pattern: "optimize self"
    priority: 7
---

# Self-Improving Agent

The **self-improving-agent** skill gives ArivuClaw the ability to monitor, analyze, and improve its own performance over time.

## How It Works

1. **Analysis** — Use `self_analyze` to review performance metrics such as accuracy, speed, token efficiency, user satisfaction, and task completion rates.
2. **Skill Improvement** — When weaknesses are identified, `self_improve_skill` generates an improved version of the target skill with better instructions, tools, or triggers.
3. **Prompt Optimization** — Use `self_improve_prompt` to iteratively refine system prompts for accuracy, conciseness, or helpfulness.
4. **A/B Testing** — Before deploying changes, `self_ab_test` runs both the old and new approaches against test cases to validate improvement.
5. **Evolution** — `self_evolve` runs continuous iterative improvement cycles within a domain, gradually enhancing capabilities over many iterations.

## Key Principles

- Changes are never deployed blindly. A/B testing ensures measurable improvement before adoption.
- All improvements are tracked in memory for auditability and rollback.
- The agent respects the learning rate to avoid catastrophic changes.
- Evolution is domain-scoped to prevent unintended side effects.

## Usage Examples

- "Analyze your performance over the last week and suggest improvements"
- "Optimize yourself for faster code generation"
- "Evolve your debugging capabilities"
- "A/B test your current review approach against a more structured one"

---
name: multi-agent-orchestrator
version: "1.0.0"
description: >
  Orchestrate multiple AI agents working in parallel on different aspects of a task.
  Agent-to-agent communication, task delegation, result aggregation.
author: ArivuClaw
tags:
  - multi-agent
  - orchestrator
  - parallel
  - delegation
  - swarm
permissions:
  - code.execute
  - system.process
  - memory.read
  - memory.write
  - network.http
  - unrestricted
tools:
  - name: orchestrate_spawn
    description: Spawn multiple agents for parallel work with defined roles, tasks, and coordination strategy.
    inputSchema:
      type: object
      properties:
        agents:
          type: array
          items:
            type: object
            properties:
              role:
                type: string
                description: The role this agent fulfills.
              task:
                type: string
                description: The task assigned to this agent.
              skills:
                type: array
                items:
                  type: string
                description: Skills this agent should use.
              constraints:
                type: array
                items:
                  type: string
                description: Constraints for this agent.
          description: Array of agent definitions to spawn.
        coordination:
          type: string
          enum:
            - parallel
            - sequential
            - pipeline
            - dag
          description: How agents should coordinate their work.
        timeout:
          type: number
          description: Timeout in milliseconds for the entire orchestration.
      required:
        - agents

  - name: orchestrate_delegate
    description: Delegate a subtask to a specific agent.
    inputSchema:
      type: object
      properties:
        agentId:
          type: string
          description: The unique identifier of the target agent.
        task:
          type: string
          description: The task to delegate.
        priority:
          type: string
          enum:
            - low
            - normal
            - high
            - critical
          description: Priority level for the delegated task.
      required:
        - agentId
        - task

  - name: orchestrate_aggregate
    description: Aggregate results from multiple agents using a specified strategy.
    inputSchema:
      type: object
      properties:
        agentIds:
          type: array
          items:
            type: string
          description: IDs of the agents whose results to aggregate.
        strategy:
          type: string
          enum:
            - merge
            - vote
            - best
            - chain
          description: Aggregation strategy to use.
      required:
        - agentIds

  - name: orchestrate_communicate
    description: Send a message between agents for coordination.
    inputSchema:
      type: object
      properties:
        fromAgent:
          type: string
          description: The sender agent ID.
        toAgent:
          type: string
          description: The recipient agent ID.
        message:
          type: string
          description: The message content.
        type:
          type: string
          enum:
            - info
            - request
            - result
            - error
          description: The type of message.
      required:
        - toAgent
        - message

  - name: orchestrate_status
    description: Get status of all orchestrated agents.
    inputSchema:
      type: object
      properties: {}

triggers:
  - type: keyword
    pattern: "multi-agent"
    priority: 9
  - type: keyword
    pattern: "orchestrate"
    priority: 7
  - type: keyword
    pattern: "parallel agents"
    priority: 8
  - type: keyword
    pattern: "swarm"
    priority: 7
---

# Multi-Agent Orchestrator

The **multi-agent-orchestrator** skill enables ArivuClaw to spawn, coordinate, and manage multiple AI agents working together on complex tasks.

## How It Works

1. **Spawning** — Define a set of agents with specific roles, tasks, and skills using `orchestrate_spawn`. Choose a coordination strategy: parallel, sequential, pipeline, or DAG (directed acyclic graph).
2. **Delegation** — Dynamically delegate new subtasks to specific agents using `orchestrate_delegate` with priority levels.
3. **Communication** — Agents exchange messages via `orchestrate_communicate` to share progress, request help, or relay results.
4. **Aggregation** — Once agents complete their work, results are combined using `orchestrate_aggregate` with strategies like merge, vote, best, or chain.
5. **Monitoring** — Track the status of all agents at any time with `orchestrate_status`.

## Coordination Strategies

- **parallel** — All agents work simultaneously on independent tasks.
- **sequential** — Agents execute one after another, each receiving the previous agent's output.
- **pipeline** — Data flows through agents in a defined pipeline with transformations at each stage.
- **dag** — Agents are arranged in a directed acyclic graph with dependency-based execution order.

## Usage Examples

- "Use multiple agents to review this PR — one for logic, one for security, one for style"
- "Orchestrate a swarm of agents to refactor this codebase"
- "Run parallel agents to implement the frontend and backend simultaneously"

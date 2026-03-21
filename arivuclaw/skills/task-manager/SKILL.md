---
name: task-manager
version: 1.0.0
description: Manages todo lists, task tracking, and lightweight project management with priorities and deadlines.
author: ArivuClaw
tags:
  - productivity
  - tasks
  - project-management
  - todo
permissions:
  - read_files
  - write_files
tools:
  - name: add_task
    description: Creates a new task with optional priority, deadline, and tags.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        title:
          type: string
          description: Task title.
        description:
          type: string
          description: Detailed task description.
        priority:
          type: string
          enum: [low, medium, high, critical]
          default: medium
        deadline:
          type: string
          format: date
          description: Due date in YYYY-MM-DD format.
        tags:
          type: array
          items:
            type: string
          description: Tags for categorization.
        project:
          type: string
          description: Project name to associate the task with.
      required:
        - title
  - name: list_tasks
    description: Lists tasks filtered by status, priority, project, or tags.
    permissions:
      - read_files
    inputSchema:
      type: object
      properties:
        status:
          type: string
          enum: [pending, in_progress, done, all]
          default: all
        priority:
          type: string
          enum: [low, medium, high, critical]
        project:
          type: string
        tags:
          type: array
          items:
            type: string
        sort_by:
          type: string
          enum: [priority, deadline, created]
          default: priority
      required: []
  - name: update_task
    description: Updates a task's status, priority, or other fields.
    permissions:
      - write_files
    inputSchema:
      type: object
      properties:
        task_id:
          type: string
          description: ID of the task to update.
        status:
          type: string
          enum: [pending, in_progress, done]
        priority:
          type: string
          enum: [low, medium, high, critical]
        deadline:
          type: string
          format: date
      required:
        - task_id
triggers:
  - pattern: "add task {title}"
  - pattern: "show my tasks"
  - pattern: "mark {task} as done"
  - pattern: "list tasks for {project}"
---

# Task Manager

Manages todo lists, task tracking, and lightweight project management with priorities, deadlines, and tagging.

## Usage

```
add task Fix login button
show my tasks
mark TASK-3 as done
list tasks for backend
```

## Features

- Task creation with priority, deadline, and tags
- Filter and sort tasks by status, priority, project, or tags
- Status tracking: pending, in_progress, done
- Project-based task grouping

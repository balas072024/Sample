---
name: jira-integration
version: 1.0.0
description: Integrates with Jira for issue management, sprint tracking, board views, and assignments.
author: ArivuClaw
tags:
  - integration
  - jira
  - project-management
  - agile
permissions:
  - network_access
tools:
  - name: manage_issues
    description: Creates, updates, transitions, or searches Jira issues.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum: [create, update, transition, search, get]
          description: Action to perform.
        project_key:
          type: string
          description: Jira project key (e.g., "PROJ").
        issue_key:
          type: string
          description: Issue key (e.g., "PROJ-123"). Required for update, transition, get.
        summary:
          type: string
          description: Issue summary (for create).
        description:
          type: string
          description: Issue description.
        issue_type:
          type: string
          enum: [Story, Bug, Task, Epic, Sub-task]
          description: Issue type (for create).
        assignee:
          type: string
          description: Assignee username.
        priority:
          type: string
          enum: [Highest, High, Medium, Low, Lowest]
        status:
          type: string
          description: Target status (for transition).
        jql:
          type: string
          description: JQL query string (for search).
      required:
        - action
  - name: manage_sprints
    description: Lists, starts, completes, or views sprint details.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        board_id:
          type: integer
          description: Jira board ID.
        action:
          type: string
          enum: [list, current, start, complete, get]
        sprint_id:
          type: integer
          description: Sprint ID (for start, complete, get).
      required:
        - board_id
        - action
  - name: get_board
    description: Retrieves board information including columns and issue counts.
    permissions:
      - network_access
    inputSchema:
      type: object
      properties:
        board_id:
          type: integer
          description: Jira board ID.
        include_issues:
          type: boolean
          description: Whether to include issues in the response.
          default: false
      required:
        - board_id
triggers:
  - pattern: "create jira {type} in {project}"
  - pattern: "show sprint for {board}"
  - pattern: "assign {issue} to {user}"
  - pattern: "search jira {query}"
  - pattern: "move {issue} to {status}"
---

# Jira Integration

Integrates with Jira for issue management, sprint tracking, board views, and team assignments.

## Usage

```
create jira Bug in BACKEND
show sprint for board 42
assign PROJ-123 to alice
search jira priority = High AND status != Done
move PROJ-456 to In Review
```

## Features

- Issue CRUD with types, priorities, and assignees
- JQL-powered search
- Sprint management: list, start, complete
- Board views with column and issue details
- Issue status transitions

---
name: jira-integration
version: "1.0.0"
description: Jira project management integration for managing issues, sprints, boards, and assignments.
author: Arivumaiyam AI
tags: [jira, project-management, issues, sprints, agile]
permissions: [network.fetch]
tools:
  - name: jira_issue
    description: View or update an existing Jira issue
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        issue_key: { type: string, description: "Jira issue key (e.g. PROJ-123)" }
        action: { type: string, enum: [view, update, transition, comment, assign], description: "Action to perform on the issue" }
        fields: { type: object, description: "Fields to update (e.g. summary, description, priority)" }
        comment: { type: string, description: "Comment text to add" }
        assignee: { type: string, description: "Username to assign the issue to" }
        transition: { type: string, description: "Transition name or ID to move the issue" }
      required: [issue_key, action]
  - name: jira_create
    description: Create a new Jira issue
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        project: { type: string, description: "Project key (e.g. PROJ)" }
        issue_type: { type: string, enum: [Bug, Story, Task, Epic, Sub-task], description: "Type of issue to create" }
        summary: { type: string, description: "Issue summary/title" }
        description: { type: string, description: "Detailed issue description" }
        priority: { type: string, enum: [Highest, High, Medium, Low, Lowest], description: "Issue priority" }
        assignee: { type: string, description: "Username to assign to" }
        labels: { type: array, items: { type: string }, description: "Labels to apply" }
      required: [project, issue_type, summary]
  - name: jira_sprint
    description: View and manage sprints in a Jira project
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, view, create, start, close], description: "Sprint action to perform" }
        board_id: { type: number, description: "Board ID the sprint belongs to" }
        sprint_id: { type: number, description: "Sprint ID for view/start/close actions" }
        name: { type: string, description: "Sprint name for create action" }
        start_date: { type: string, description: "Sprint start date in ISO 8601 format" }
        end_date: { type: string, description: "Sprint end date in ISO 8601 format" }
      required: [action, board_id]
  - name: jira_board
    description: View and manage Jira boards
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, view, backlog, configuration], description: "Board action to perform" }
        board_id: { type: number, description: "Board ID for view and related actions" }
        project: { type: string, description: "Project key to filter boards" }
        board_type: { type: string, enum: [scrum, kanban], description: "Board type filter" }
      required: [action]
  - name: jira_search
    description: Search Jira issues using JQL
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        jql: { type: string, description: "JQL query string" }
        max_results: { type: number, description: "Maximum number of results to return" }
        fields: { type: array, items: { type: string }, description: "Fields to include in results" }
        order_by: { type: string, description: "Field to sort results by" }
      required: [jql]
triggers:
  - type: keyword
    pattern: "jira|sprint|backlog|ticket|story|epic|board"
    priority: 7
---

# Jira Integration

You are a Jira project management assistant.

Help the user manage their Jira projects, issues, sprints, and boards. When viewing issues, present all relevant fields including status, assignee, priority, and linked issues. For creating issues, suggest appropriate issue types and priorities. When working with sprints, show velocity and burndown information where available. Help construct JQL queries for complex searches. Always confirm before making changes to issues or sprints.

---
name: github-integration
version: "1.0.0"
description: Full GitHub integration for managing repos, pull requests, issues, actions, releases, and code search.
author: ArivuClaw
tags: [github, git, repository, pr, issues, actions]
permissions: [network.fetch, filesystem.read]
tools:
  - name: gh_repo
    description: Manage GitHub repositories including create, list, clone, and view details
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, view, clone, delete, fork], description: "Repository action to perform" }
        repo: { type: string, description: "Repository in owner/name format" }
        visibility: { type: string, enum: [public, private, internal], description: "Repository visibility for create action" }
        description: { type: string, description: "Repository description" }
      required: [action]
  - name: gh_pr
    description: Manage pull requests including create, list, review, merge, and diff
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, view, merge, close, review, diff], description: "Pull request action to perform" }
        repo: { type: string, description: "Repository in owner/name format" }
        pr_number: { type: number, description: "Pull request number" }
        title: { type: string, description: "PR title for create action" }
        body: { type: string, description: "PR body/description" }
        base: { type: string, description: "Base branch for the PR" }
        head: { type: string, description: "Head branch for the PR" }
      required: [action, repo]
  - name: gh_issue
    description: Manage GitHub issues including create, list, comment, close, and label
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, view, close, comment, label], description: "Issue action to perform" }
        repo: { type: string, description: "Repository in owner/name format" }
        issue_number: { type: number, description: "Issue number" }
        title: { type: string, description: "Issue title for create action" }
        body: { type: string, description: "Issue body/description" }
        labels: { type: array, items: { type: string }, description: "Labels to apply" }
      required: [action, repo]
  - name: gh_actions
    description: View and manage GitHub Actions workflows and runs
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list_workflows, list_runs, view_run, trigger, cancel, logs], description: "Actions operation to perform" }
        repo: { type: string, description: "Repository in owner/name format" }
        workflow_id: { type: string, description: "Workflow ID or filename" }
        run_id: { type: number, description: "Workflow run ID" }
        branch: { type: string, description: "Branch to filter by" }
      required: [action, repo]
  - name: gh_search
    description: Search GitHub code, repositories, issues, and users
    permissions: [network.fetch]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "Search query string" }
        scope: { type: string, enum: [code, repos, issues, users], description: "What to search" }
        language: { type: string, description: "Filter by programming language" }
        sort: { type: string, enum: [stars, forks, updated, best-match], description: "Sort order for results" }
        limit: { type: number, description: "Maximum number of results" }
      required: [query, scope]
triggers:
  - type: keyword
    pattern: "github|repo|pull request|pr|issue|actions|workflow"
    priority: 8
---

# GitHub Integration

You are a GitHub integration assistant.

Help the user manage their GitHub repositories, pull requests, issues, and workflows. When listing items, present them in a clear tabular format. For PRs, always show the status, reviewers, and checks. When creating issues or PRs, suggest labels and assignees based on content. For actions, monitor workflow runs and report failures clearly. Always confirm destructive operations like deleting repos or closing issues before proceeding.

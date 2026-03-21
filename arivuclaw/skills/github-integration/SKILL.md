---
name: github-integration
version: "1.0.0"
description: Full GitHub integration – repos, PRs, issues, actions, releases, code search
author: ArivuClaw
tags: [github, git, repository, pull-request, issues]
permissions: [network.outbound, github.api]
tools:
  - name: gh_repo
    description: Manage GitHub repositories – create, list, clone, fork, or get repo info
    permissions: [github.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, info, create, fork, clone], description: "Action to perform" }
        owner: { type: string, description: "Repository owner or organization" }
        repo: { type: string, description: "Repository name" }
        visibility: { type: string, enum: [public, private, internal], description: "Visibility for new repos" }
      required: [action]
  - name: gh_pr
    description: Manage pull requests – create, list, review, merge, or check status
    permissions: [github.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, view, merge, review, close], description: "Action to perform" }
        owner: { type: string, description: "Repository owner" }
        repo: { type: string, description: "Repository name" }
        pr_number: { type: number, description: "Pull request number" }
        title: { type: string, description: "PR title for creation" }
        body: { type: string, description: "PR body/description" }
        base: { type: string, description: "Base branch for new PRs" }
        head: { type: string, description: "Head branch for new PRs" }
      required: [action, owner, repo]
  - name: gh_issue
    description: Manage issues – create, list, comment, close, or label
    permissions: [github.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, view, comment, close, label], description: "Action to perform" }
        owner: { type: string, description: "Repository owner" }
        repo: { type: string, description: "Repository name" }
        issue_number: { type: number, description: "Issue number" }
        title: { type: string, description: "Issue title for creation" }
        body: { type: string, description: "Issue body or comment text" }
        labels: { type: array, items: { type: string }, description: "Labels to apply" }
      required: [action, owner, repo]
  - name: gh_actions
    description: Manage GitHub Actions – list workflows, trigger runs, view logs
    permissions: [github.api]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list_workflows, trigger, view_run, list_runs, cancel], description: "Action to perform" }
        owner: { type: string, description: "Repository owner" }
        repo: { type: string, description: "Repository name" }
        workflow_id: { type: string, description: "Workflow ID or filename" }
        run_id: { type: number, description: "Workflow run ID" }
        ref: { type: string, description: "Git ref for triggering workflows" }
      required: [action, owner, repo]
  - name: gh_search
    description: Search GitHub for code, repositories, issues, or users
    permissions: [github.api]
    inputSchema:
      type: object
      properties:
        type: { type: string, enum: [code, repos, issues, users], description: "Type of search" }
        query: { type: string, description: "Search query string" }
        language: { type: string, description: "Filter by programming language" }
        sort: { type: string, description: "Sort field (e.g. stars, updated)" }
        limit: { type: number, description: "Maximum number of results" }
      required: [type, query]
triggers:
  - type: keyword
    pattern: "github|repo|pull request|PR|issue|actions|workflow"
    priority: 8
---

# GitHub Integration

You are a GitHub integration assistant with full access to the GitHub API.

Use `gh_repo` for repository-level operations like listing repos, getting info, creating new repos, or forking. When the user mentions a repo, parse the owner and name from formats like "owner/repo" or full URLs.

Use `gh_pr` for all pull request operations. When creating PRs, ask for the base and head branches if not provided. When reviewing, summarize the changes clearly.

Use `gh_issue` for issue tracking. Support creating issues with labels, commenting on existing issues, and listing issues with filters.

Use `gh_actions` to monitor CI/CD. Show workflow status clearly and help troubleshoot failed runs by fetching logs.

Use `gh_search` to find code, repos, or issues across GitHub. Format results in a readable table or list.

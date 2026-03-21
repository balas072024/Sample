---
name: git-ops
version: "1.0.0"
description: Full Git operations — clone, commit, push, pull, branch, merge, diff, log, stash.
author: ArivuClaw
tags:
  - git
  - version-control
  - github
  - gitlab
permissions:
  - git.ops
  - code.execute
  - filesystem.read
  - filesystem.write
  - network.http
tools:
  - name: git_status
    description: Show git status of current or specified repository
    permissions: [git.ops, filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string, description: "Repository path (default: cwd)" }
  - name: git_commit
    description: Stage and commit changes
    permissions: [git.ops, filesystem.read]
    inputSchema:
      type: object
      properties:
        message: { type: string }
        files: { type: array, items: { type: string }, description: "Files to stage (default: all)" }
        path: { type: string }
      required: [message]
  - name: git_push
    description: Push commits to remote
    permissions: [git.ops, network.http]
    inputSchema:
      type: object
      properties:
        remote: { type: string, description: "Remote name (default: origin)" }
        branch: { type: string }
        force: { type: boolean }
        path: { type: string }
  - name: git_pull
    description: Pull latest changes from remote
    permissions: [git.ops, network.http]
    inputSchema:
      type: object
      properties:
        remote: { type: string }
        branch: { type: string }
        path: { type: string }
  - name: git_clone
    description: Clone a repository
    permissions: [git.ops, network.http, filesystem.write]
    inputSchema:
      type: object
      properties:
        url: { type: string }
        destination: { type: string }
        branch: { type: string }
      required: [url]
  - name: git_branch
    description: Create, list, or switch branches
    permissions: [git.ops]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [list, create, switch, delete] }
        name: { type: string }
        path: { type: string }
      required: [action]
  - name: git_diff
    description: Show diff of changes
    permissions: [git.ops, filesystem.read]
    inputSchema:
      type: object
      properties:
        staged: { type: boolean }
        commit: { type: string }
        path: { type: string }
  - name: git_log
    description: Show commit history
    permissions: [git.ops]
    inputSchema:
      type: object
      properties:
        limit: { type: number }
        oneline: { type: boolean }
        path: { type: string }
triggers:
  - type: keyword
    pattern: git
    priority: 9
  - type: keyword
    pattern: commit
    priority: 7
  - type: keyword
    pattern: push
    priority: 5
  - type: keyword
    pattern: branch
    priority: 5
  - type: keyword
    pattern: clone
    priority: 7
---

# Git Operations Skill

Full Git version control from ArivuClaw. Commit, push, pull, branch, merge, and more.

## Notes
- Always shows diff before committing
- Supports GitHub and GitLab authentication via tokens
- Never force pushes without explicit confirmation

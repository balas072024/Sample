---
name: system-info
version: "1.0.0"
description: System information, process management, package installation, service control.
author: Arivumaiyam AI
tags:
  - system
  - process
  - install
  - service
  - hardware
permissions:
  - system.process
  - system.admin
  - code.execute
tools:
  - name: system_info
    description: Get comprehensive system information (OS, CPU, RAM, disk, network)
    permissions: [system.process]
    inputSchema:
      type: object
      properties: {}
  - name: process_list
    description: List running processes
    permissions: [system.process]
    inputSchema:
      type: object
      properties:
        filter: { type: string, description: "Filter by process name" }
        sortBy: { type: string, enum: [cpu, mem, pid, name] }
  - name: process_kill
    description: Kill a process by PID or name
    permissions: [system.process, system.admin]
    inputSchema:
      type: object
      properties:
        pid: { type: number }
        name: { type: string }
        signal: { type: string, description: "Signal to send (default: SIGTERM)" }
  - name: install_package
    description: Install a system package using the appropriate package manager
    permissions: [system.admin, code.execute]
    inputSchema:
      type: object
      properties:
        package: { type: string }
        manager: { type: string, enum: [auto, apt, yum, dnf, pacman, brew, snap, flatpak] }
      required: [package]
  - name: manage_service
    description: Start, stop, restart, or check status of a system service
    permissions: [system.admin]
    inputSchema:
      type: object
      properties:
        service: { type: string }
        action: { type: string, enum: [start, stop, restart, status, enable, disable] }
      required: [service, action]
  - name: disk_usage
    description: Show disk usage for a path
    permissions: [filesystem.read]
    inputSchema:
      type: object
      properties:
        path: { type: string }
  - name: network_info
    description: Show network interfaces, connections, and routing
    permissions: [system.process]
    inputSchema:
      type: object
      properties:
        detail: { type: string, enum: [interfaces, connections, routes, dns] }
  - name: env_vars
    description: Get or set environment variables
    permissions: [system.env]
    inputSchema:
      type: object
      properties:
        action: { type: string, enum: [get, set, list] }
        key: { type: string }
        value: { type: string }
      required: [action]
triggers:
  - type: keyword
    pattern: system
    priority: 6
  - type: keyword
    pattern: install
    priority: 7
  - type: keyword
    pattern: process
    priority: 5
  - type: keyword
    pattern: service
    priority: 6
  - type: keyword
    pattern: disk
    priority: 5
  - type: keyword
    pattern: hardware
    priority: 5
---

# System Information & Management Skill

Full system control — hardware info, process management, package installation, service control.

## Capabilities
- Get CPU, RAM, disk, network info
- List/kill processes
- Install packages via apt/yum/brew/snap/etc.
- Manage systemd services
- View/set environment variables
- Network diagnostics

## Requires
- Unrestricted or local-admin mode for package installation and service management

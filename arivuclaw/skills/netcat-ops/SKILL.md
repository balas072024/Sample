---
name: netcat-ops
version: "1.0.0"
description: "Netcat/Ncat — the Swiss Army knife of networking. Port scanning, file transfer, reverse shells, port forwarding."
author: ArivuClaw
tags:
  - netcat
  - nc
  - ncat
  - network
  - transfer
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: nc_listen
    description: Start a netcat listener on a specified port
    inputSchema:
      type: object
      properties:
        port:
          type: number
          description: Port number to listen on
        udp:
          type: boolean
          description: Use UDP instead of TCP
        execute:
          type: string
          description: Program to execute on connection
        outputFile:
          type: string
          description: File to write received data to
        verbose:
          type: boolean
          description: Enable verbose output
      required:
        - port
  - name: nc_connect
    description: Connect to a remote host and port
    inputSchema:
      type: object
      properties:
        host:
          type: string
          description: Target host or IP address
        port:
          type: number
          description: Target port number
        udp:
          type: boolean
          description: Use UDP instead of TCP
        data:
          type: string
          description: Data to send upon connection
        timeout:
          type: number
          description: Connection timeout in seconds
      required:
        - host
        - port
  - name: nc_transfer
    description: Transfer a file via netcat
    inputSchema:
      type: object
      properties:
        mode:
          type: string
          enum: [send, receive]
          description: Transfer mode
        host:
          type: string
          description: Remote host (required for send mode)
        port:
          type: number
          description: Port to use for the transfer
        file:
          type: string
          description: File path to send or save to
      required:
        - mode
        - port
        - file
  - name: nc_scan
    description: Basic port scanning with netcat
    inputSchema:
      type: object
      properties:
        host:
          type: string
          description: Target host or IP address
        ports:
          type: string
          description: "Port range or list (e.g., 1-1024, 22,80,443)"
        timeout:
          type: number
          description: Connection timeout per port in seconds
        verbose:
          type: boolean
          description: Enable verbose output
      required:
        - host
        - ports
triggers:
  - type: keyword
    pattern: "netcat"
    priority: 9
  - type: keyword
    pattern: "nc "
    priority: 7
environment:
  binaries: []
---

# Netcat/Ncat Network Operations

This skill provides an interface to Netcat (nc/ncat), the Swiss Army knife of networking, for port scanning, file transfers, reverse shells, and basic network connectivity testing.

## Usage

- **nc_listen** — Start a listener on a port, optionally executing a program on connection.
- **nc_connect** — Connect to a remote host and port, optionally sending data.
- **nc_transfer** — Transfer files between hosts using netcat.
- **nc_scan** — Perform basic port scanning against a target.

## Instructions

1. Use `nc_listen` to set up listeners for catching reverse shells or receiving files.
2. Use `nc_connect` to establish outbound connections and interact with services.
3. Use `nc_transfer` for simple file transfers between systems without additional tooling.
4. Use `nc_scan` for quick port scanning when more advanced tools are unavailable.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the system owner before using netcat for shell access, port scanning, or data transfer on target systems. Unauthorized use of this tool against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

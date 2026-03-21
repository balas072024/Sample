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
          description: Program to execute on connection (e.g., /bin/bash)
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
          description: Target hostname or IP address
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
    description: Transfer a file using netcat
    inputSchema:
      type: object
      properties:
        mode:
          type: string
          enum:
            - send
            - receive
          description: Transfer mode (send or receive)
        host:
          type: string
          description: Remote host (required for send mode)
        port:
          type: number
          description: Port to use for the transfer
        file:
          type: string
          description: Path to the file to send or receive
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
          description: Target hostname or IP address
        ports:
          type: string
          description: "Port range or list (e.g., 1-1024, 80,443,8080)"
        timeout:
          type: number
          description: Timeout per port in seconds
        verbose:
          type: boolean
          description: Enable verbose output
      required:
        - host
        - ports
triggers:
  - type: keyword
    value: "netcat"
    priority: 9
  - type: keyword
    value: "nc "
    priority: 7
---

# Netcat / Ncat Network Operations

This skill provides an interface to Netcat (nc/ncat), the Swiss Army knife of networking. It supports raw TCP/UDP connections, port scanning, file transfers, and shell relaying.

## Capabilities

- **Listening**: Set up listeners for incoming connections on any port.
- **Connections**: Connect to remote hosts for banner grabbing, data transfer, or shell access.
- **File Transfer**: Send and receive files over the network without additional services.
- **Port Scanning**: Perform basic TCP/UDP port scans against target hosts.

## Usage

1. Use `nc_listen` to start a listener on a port for incoming connections.
2. Use `nc_connect` to connect to a remote host and port.
3. Use `nc_transfer` to send or receive files over the network.
4. Use `nc_scan` for basic port scanning and service discovery.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against systems and networks you have explicit written permission to test. Unauthorized network access, port scanning, and shell deployment are illegal. Always obtain proper authorization before conducting any network operations with these tools.

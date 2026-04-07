---
name: port-forwarding
version: "1.0.0"
description: "Port forwarding, tunneling, and pivoting — SSH tunnels, socat, chisel, ligolo."
author: ArivuClaw
tags:
  - tunnel
  - portforward
  - pivot
  - ssh
  - proxy
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: ssh_tunnel
    description: Create an SSH port forward or tunnel
    inputSchema:
      type: object
      properties:
        type:
          type: string
          enum: [local, remote, dynamic]
          description: "Tunnel type: local (-L), remote (-R), or dynamic (-D) forwarding"
        localPort:
          type: number
          description: Local port to bind
        remoteHost:
          type: string
          description: Remote host to forward to (for local/remote tunnels)
        remotePort:
          type: number
          description: Remote port to forward to
        sshHost:
          type: string
          description: SSH server hostname or IP
        sshUser:
          type: string
          description: SSH username
        sshKey:
          type: string
          description: Path to SSH private key file
      required:
        - type
        - localPort
        - sshHost
        - sshUser
  - name: socat_forward
    description: Create a socat port forward
    inputSchema:
      type: object
      properties:
        listenPort:
          type: number
          description: Local port to listen on
        targetHost:
          type: string
          description: Target host to forward traffic to
        targetPort:
          type: number
          description: Target port to forward traffic to
        protocol:
          type: string
          enum: [tcp, udp]
          description: Protocol to use
      required:
        - listenPort
        - targetHost
        - targetPort
  - name: chisel_server
    description: Start a chisel server for tunneling
    inputSchema:
      type: object
      properties:
        port:
          type: number
          description: Port for the chisel server to listen on
        reverse:
          type: boolean
          description: Allow reverse tunneling
        auth:
          type: string
          description: "Authentication credentials (user:password)"
      required:
        - port
  - name: chisel_client
    description: Connect a chisel client to a server
    inputSchema:
      type: object
      properties:
        server:
          type: string
          description: "Chisel server URL (e.g., http://host:port)"
        tunnels:
          type: array
          items:
            type: string
          description: "Tunnel definitions (e.g., ['8080:10.0.0.1:80', 'socks'])"
      required:
        - server
        - tunnels
  - name: sshuttle_vpn
    description: Create a VPN-like tunnel via SSH
    inputSchema:
      type: object
      properties:
        sshHost:
          type: string
          description: SSH server to tunnel through
        subnets:
          type: array
          items:
            type: string
          description: "Subnets to route through the tunnel (e.g., ['10.0.0.0/24'])"
        excludeSubnets:
          type: array
          items:
            type: string
          description: Subnets to exclude from tunneling
      required:
        - sshHost
        - subnets
triggers:
  - type: keyword
    pattern: "tunnel"
    priority: 7
  - type: keyword
    pattern: "port forward"
    priority: 8
  - type: keyword
    pattern: "pivot"
    priority: 7
  - type: keyword
    pattern: "chisel"
    priority: 9
environment:
  binaries: []
---

# Port Forwarding, Tunneling & Pivoting

This skill provides tools for port forwarding, tunneling, and pivoting through compromised hosts using SSH tunnels, socat, chisel, and sshuttle.

## Usage

- **ssh_tunnel** — Create local, remote, or dynamic SSH port forwards.
- **socat_forward** — Set up TCP/UDP port forwarding with socat.
- **chisel_server** — Start a chisel tunneling server on a compromised host.
- **chisel_client** — Connect to a chisel server and establish tunnels.
- **sshuttle_vpn** — Create a transparent VPN-like tunnel over SSH for routing entire subnets.

## Instructions

1. Use `ssh_tunnel` for standard port forwarding when SSH access is available.
2. Use `socat_forward` for simple port-to-port forwarding on a compromised host.
3. Use `chisel_server` and `chisel_client` for tunneling through firewalls when only HTTP is allowed.
4. Use `sshuttle_vpn` when you need to route traffic to entire subnets through an SSH pivot.
5. Chain multiple tunnels together for multi-hop pivoting through network segments.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the network owner before establishing tunnels or pivoting through systems. Unauthorized use of port forwarding or tunneling tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

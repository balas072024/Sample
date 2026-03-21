---
name: port-forwarding
version: "1.0.0"
description: Port forwarding, tunneling, and pivoting — SSH tunnels, socat, chisel, sshuttle.
author: ArivuClaw
tags: [tunnel, portforward, pivot, ssh, proxy, chisel]
permissions: [network.tcp, system.process, code.execute, unrestricted]
tools:
  - name: ssh_tunnel
    description: Create SSH port forward/tunnel
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        type: { type: string, enum: [local, remote, dynamic] }
        localPort: { type: number }
        remoteHost: { type: string }
        remotePort: { type: number }
        sshHost: { type: string }
        sshUser: { type: string }
        sshKey: { type: string }
      required: [type, localPort, sshHost, sshUser]
  - name: socat_forward
    description: Create a socat port forward
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        listenPort: { type: number }
        targetHost: { type: string }
        targetPort: { type: number }
        protocol: { type: string, enum: [tcp, udp] }
      required: [listenPort, targetHost, targetPort]
  - name: chisel_server
    description: Start a chisel tunneling server
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        port: { type: number }
        reverse: { type: boolean }
        auth: { type: string }
      required: [port]
  - name: chisel_client
    description: Connect chisel client to server
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        server: { type: string }
        tunnels: { type: array, items: { type: string } }
      required: [server, tunnels]
  - name: sshuttle_vpn
    description: Create a VPN-like tunnel via SSH
    permissions: [network.tcp, system.process, system.admin]
    inputSchema:
      type: object
      properties:
        sshHost: { type: string }
        subnets: { type: array, items: { type: string } }
        excludeSubnets: { type: array, items: { type: string } }
      required: [sshHost, subnets]
triggers:
  - type: keyword
    pattern: tunnel
    priority: 7
  - type: keyword
    pattern: port forward
    priority: 8
  - type: keyword
    pattern: chisel
    priority: 9
  - type: keyword
    pattern: sshuttle
    priority: 9
---

# Port Forwarding & Tunneling

SSH tunnels, socat, chisel, and sshuttle for authorized penetration testing and network access.

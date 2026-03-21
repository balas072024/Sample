---
name: pivoting-tools
version: "1.0.0"
description: Network pivoting and proxying — proxychains, SOCKS proxies, Ligolo-ng, double pivoting.
author: ArivuClaw
tags: [pivoting, proxy, socks, proxychains, ligolo]
permissions: [network.tcp, system.process, code.execute, unrestricted]
tools:
  - name: proxychains_run
    description: Run a command through proxychains
    permissions: [system.process, code.execute]
    inputSchema:
      type: object
      properties:
        command: { type: string }
        proxyList: { type: array, items: { type: string } }
        protocol: { type: string, enum: [socks4, socks5, http] }
      required: [command]
  - name: ligolo_agent
    description: Start a Ligolo-ng agent
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        server: { type: string }
        retry: { type: boolean }
      required: [server]
  - name: ligolo_proxy
    description: Start a Ligolo-ng proxy server
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        listenPort: { type: number }
        selfcert: { type: boolean }
  - name: socks_proxy
    description: Start a SOCKS proxy server
    permissions: [network.tcp, system.process]
    inputSchema:
      type: object
      properties:
        port: { type: number }
        type: { type: string, enum: [socks4, socks5] }
        auth: { type: boolean }
      required: [port]
  - name: double_pivot
    description: Set up a double pivot through two compromised hosts
    permissions: [network.tcp, system.process, code.execute]
    inputSchema:
      type: object
      properties:
        firstHop: { type: string }
        secondHop: { type: string }
        targetSubnet: { type: string }
        method: { type: string, enum: [ssh, chisel, ligolo] }
      required: [firstHop, secondHop, targetSubnet]
triggers:
  - type: keyword
    pattern: pivot
    priority: 7
  - type: keyword
    pattern: proxychains
    priority: 9
  - type: keyword
    pattern: ligolo
    priority: 9
  - type: keyword
    pattern: socks proxy
    priority: 7
---

# Pivoting Tools

Network pivoting and proxy chaining for authorized penetration testing. Route traffic through compromised hosts to reach internal networks.

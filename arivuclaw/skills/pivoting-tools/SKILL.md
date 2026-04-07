---
name: pivoting-tools
version: "1.0.0"
description: "Network pivoting and proxying — proxychains, SOCKS proxies, Ligolo-ng, double pivoting."
author: ArivuClaw
tags:
  - pivoting
  - proxy
  - socks
  - proxychains
  - ligolo
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: proxychains_run
    description: Run a command through proxychains
    inputSchema:
      type: object
      properties:
        command:
          type: string
          description: Command to execute through the proxy
        proxyList:
          type: array
          items:
            type: string
          description: "List of proxy addresses (e.g., [\"socks5://127.0.0.1:1080\"])"
        protocol:
          type: string
          enum: [socks4, socks5, http]
          description: Proxy protocol type
      required: [command]
  - name: ligolo_agent
    description: Start a Ligolo-ng agent
    inputSchema:
      type: object
      properties:
        server:
          type: string
          description: Ligolo-ng proxy server address (host:port)
        retry:
          type: boolean
          description: Enable automatic reconnection
      required: [server]
  - name: ligolo_proxy
    description: Start a Ligolo-ng proxy server
    inputSchema:
      type: object
      properties:
        listenPort:
          type: number
          description: Port for the proxy server to listen on
        selfcert:
          type: boolean
          description: Use a self-signed certificate
  - name: socks_proxy
    description: Start a SOCKS proxy server
    inputSchema:
      type: object
      properties:
        port:
          type: number
          description: Port for the SOCKS proxy to listen on
        type:
          type: string
          enum: [socks4, socks5]
          description: SOCKS version
        auth:
          type: boolean
          description: Enable authentication
        username:
          type: string
          description: Username for proxy authentication
        password:
          type: string
          description: Password for proxy authentication
      required: [port]
  - name: double_pivot
    description: Set up a double pivot
    inputSchema:
      type: object
      properties:
        firstHop:
          type: string
          description: First pivot host (IP or hostname)
        secondHop:
          type: string
          description: Second pivot host (IP or hostname)
        targetSubnet:
          type: string
          description: Target subnet to reach (CIDR notation)
        method:
          type: string
          enum: [ssh, chisel, ligolo]
          description: Pivoting method to use
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

# Pivoting Tools — Network Pivoting and Proxying

This skill provides network pivoting and proxying capabilities for reaching internal networks through compromised hosts using proxychains, SOCKS proxies, Ligolo-ng, and multi-hop pivoting.

## Capabilities

- **Proxychains**: Route any command through one or more proxy servers to reach internal networks from an external position.
- **Ligolo-ng Agent**: Deploy a Ligolo-ng agent on a compromised host to create a reverse tunnel back to the attacker.
- **Ligolo-ng Proxy**: Run a Ligolo-ng proxy server to manage agent connections and route traffic into target networks.
- **SOCKS Proxy**: Start a local SOCKS4/SOCKS5 proxy server with optional authentication for tunneling traffic.
- **Double Pivoting**: Set up multi-hop pivots through two intermediate hosts to reach deeply segmented networks using SSH, Chisel, or Ligolo-ng.

## Usage

1. Establish a foothold on the first compromised host.
2. Start a SOCKS proxy or Ligolo-ng agent on the compromised host.
3. Use `proxychains_run` to route scanning and exploitation tools through the pivot.
4. For deeper networks, use `double_pivot` to chain through multiple hops.

## Requirements

- Proxychains installed and configured on the attacker machine
- Ligolo-ng agent and proxy binaries
- SSH access or Chisel for alternative pivoting methods
- Network connectivity between pivot hosts

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before establishing network pivots or proxying traffic through compromised systems. Unauthorized use of these techniques against systems you do not own or have permission to test is illegal and unethical.

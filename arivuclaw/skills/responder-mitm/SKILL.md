---
name: responder-mitm
version: "1.0.0"
description: "Responder LLMNR/NBT-NS/MDNS poisoner and NTLM relay for network credential capture."
author: Arivumaiyam AI
tags:
  - responder
  - mitm
  - ntlm
  - relay
  - poisoning
permissions:
  - network.tcp
  - system.process
  - system.admin
  - code.execute
  - unrestricted
tools:
  - name: responder_start
    description: Start the Responder poisoner on a network interface
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Network interface to listen on
        analyze:
          type: boolean
          description: Run in analyze mode only (passive, no poisoning)
        wpad:
          type: boolean
          description: Enable WPAD rogue proxy
        fingerprint:
          type: boolean
          description: Enable OS fingerprinting
        verbose:
          type: boolean
          description: Enable verbose output
      required:
        - interface
  - name: responder_logs
    description: View captured hashes and credentials from Responder logs
    inputSchema:
      type: object
      properties:
        logDir:
          type: string
          description: Path to Responder log directory
  - name: ntlmrelay
    description: Start an NTLM relay attack
    inputSchema:
      type: object
      properties:
        targetFile:
          type: string
          description: Path to file containing relay target hosts
        smbToSmb:
          type: boolean
          description: Enable SMB-to-SMB relay
        socks:
          type: boolean
          description: Enable SOCKS proxy for relayed sessions
        command:
          type: string
          description: Command to execute on successful relay
      required:
        - targetFile
triggers:
  - type: keyword
    pattern: "responder"
    priority: 9
  - type: keyword
    pattern: "ntlm"
    priority: 7
  - type: keyword
    pattern: "relay"
    priority: 5
  - type: keyword
    pattern: "poisoning"
    priority: 7
environment:
  binaries:
    - responder
---

# Responder MITM & NTLM Relay

This skill provides an interface to Responder for LLMNR/NBT-NS/MDNS poisoning and NTLM relay attacks for network credential capture during penetration testing.

## Usage

- **responder_start** — Launch Responder to poison name resolution requests and capture credential hashes.
- **responder_logs** — Review captured NTLMv1/NTLMv2 hashes and cleartext credentials.
- **ntlmrelay** — Relay captured NTLM authentication to target hosts for lateral movement.

## Instructions

1. Start Responder in analyze mode first to passively observe network traffic and identify targets.
2. When ready, run Responder with poisoning enabled to capture NTLM hashes.
3. Use `responder_logs` to review and export captured hashes for offline cracking.
4. Use `ntlmrelay` to relay captured authentication to other hosts in the network.
5. Enable SOCKS proxy mode with ntlmrelay for persistent access through relayed sessions.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the network owner before running any poisoning or relay operations. Unauthorized interception of network credentials or man-in-the-middle attacks is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

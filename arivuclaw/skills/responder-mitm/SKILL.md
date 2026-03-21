---
name: responder-mitm
version: "1.0.0"
description: "Responder LLMNR/NBT-NS/MDNS poisoner and NTLM relay for network credential capture."
author: ArivuClaw
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
    description: Start Responder LLMNR/NBT-NS/MDNS poisoner
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
          description: Fingerprint hosts that respond
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
          description: Path to the Responder logs directory
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
          description: Enable SOCKS proxy for relayed connections
        command:
          type: string
          description: Command to execute on successful relay
      required:
        - targetFile
triggers:
  - type: keyword
    value: "responder"
    priority: 9
  - type: keyword
    value: "ntlm"
    priority: 7
  - type: keyword
    value: "relay"
    priority: 5
  - type: keyword
    value: "poisoning"
    priority: 7
environment:
  binaries:
    - responder
---

# Responder MITM & NTLM Relay

This skill provides an interface to Responder, a powerful LLMNR, NBT-NS, and MDNS poisoner used for capturing network credentials, and ntlmrelayx for relaying NTLM authentication to target systems.

## Capabilities

- **Protocol Poisoning**: Poison LLMNR, NBT-NS, and MDNS requests to redirect authentication.
- **Credential Capture**: Capture NTLMv1/v2 hashes, HTTP Basic credentials, and more.
- **WPAD Proxy**: Deploy a rogue WPAD proxy for credential interception.
- **NTLM Relay**: Relay captured NTLM authentication to other systems for lateral movement.
- **Analyze Mode**: Passive mode to observe name resolution traffic without poisoning.

## Usage

1. Use `responder_start` with `analyze: true` first to observe traffic passively.
2. Use `responder_start` to begin active poisoning and credential capture.
3. Use `responder_logs` to review captured hashes and credentials.
4. Use `ntlmrelay` to relay captured authentication to target systems.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools on networks you have explicit written permission to test. LLMNR/NBT-NS poisoning and NTLM relay attacks can disrupt network services and intercept credentials. Unauthorized use is illegal and may result in criminal prosecution. Always obtain proper authorization and coordinate with network administrators before conducting any MITM testing.

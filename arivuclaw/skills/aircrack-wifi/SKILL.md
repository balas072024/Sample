---
name: aircrack-wifi
version: "1.0.0"
description: "Wireless network security testing — capture, deauth, crack WPA/WPA2/WEP, monitor mode."
author: ArivuClaw
tags:
  - aircrack
  - wifi
  - wireless
  - wpa
  - wep
permissions:
  - network.tcp
  - system.process
  - system.admin
  - code.execute
  - unrestricted
tools:
  - name: airmon_start
    description: Enable monitor mode on a wireless interface
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Wireless interface name (e.g., wlan0)
        channel:
          type: number
          description: Lock to a specific wireless channel
      required:
        - interface
  - name: airodump_scan
    description: Capture wireless packets and discover nearby networks
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Monitor mode interface (e.g., wlan0mon)
        channel:
          type: number
          description: Specific channel to monitor
        bssid:
          type: string
          description: Filter by target access point BSSID
        outputPrefix:
          type: string
          description: Output file prefix for captured data
      required:
        - interface
  - name: aireplay_deauth
    description: Send deauthentication packets to force handshake capture
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Monitor mode interface
        bssid:
          type: string
          description: Target access point BSSID
        station:
          type: string
          description: Target client station MAC address
        count:
          type: number
          description: Number of deauthentication packets to send
      required:
        - interface
        - bssid
  - name: aircrack_crack
    description: Crack a WPA/WPA2 handshake using a wordlist
    inputSchema:
      type: object
      properties:
        capFile:
          type: string
          description: Path to the capture file containing the handshake
        wordlist:
          type: string
          description: Path to the wordlist file
        bssid:
          type: string
          description: Target access point BSSID
      required:
        - capFile
        - wordlist
  - name: aircrack_wep
    description: Crack a WEP key from captured initialization vectors
    inputSchema:
      type: object
      properties:
        capFile:
          type: string
          description: Path to the capture file containing IVs
      required:
        - capFile
triggers:
  - type: keyword
    value: "aircrack"
    priority: 9
  - type: keyword
    value: "wifi crack"
    priority: 8
  - type: keyword
    value: "wireless"
    priority: 5
  - type: keyword
    value: "wpa"
    priority: 8
environment:
  binaries:
    - aircrack-ng
---

# Aircrack-ng Wireless Security Testing

This skill provides an interface to the Aircrack-ng suite, a complete set of tools for assessing wireless network security. It covers monitoring, attacking, testing, and cracking Wi-Fi networks.

## Capabilities

- **Monitor Mode**: Enable monitor mode on wireless interfaces for packet capture.
- **Network Discovery**: Scan and discover nearby wireless networks and clients.
- **Deauthentication**: Send deauth packets to capture WPA/WPA2 handshakes.
- **WPA/WPA2 Cracking**: Crack captured handshakes using wordlist attacks.
- **WEP Cracking**: Recover WEP keys from captured initialization vectors.

## Usage

1. Use `airmon_start` to enable monitor mode on your wireless interface.
2. Use `airodump_scan` to discover networks and capture packets.
3. Use `aireplay_deauth` to force a client to reconnect and capture the handshake.
4. Use `aircrack_crack` to crack the WPA/WPA2 handshake with a wordlist.
5. Use `aircrack_wep` to crack WEP keys from captured IVs.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against wireless networks you own or have explicit written permission to test. Unauthorized wireless network testing is illegal and may violate federal and local laws. Always obtain proper authorization before conducting any wireless security assessments.

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
          description: Specific channel to monitor
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
          description: Specific channel to scan
        bssid:
          type: string
          description: Target BSSID to filter on
        outputPrefix:
          type: string
          description: Output file prefix for captured data
      required:
        - interface
  - name: aireplay_deauth
    description: Send deauthentication packets to capture WPA handshake
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
          description: Number of deauth packets to send
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
          description: Target BSSID to crack
      required:
        - capFile
        - wordlist
  - name: aircrack_wep
    description: Crack a WEP key from captured IVs
    inputSchema:
      type: object
      properties:
        capFile:
          type: string
          description: Path to the capture file containing WEP IVs
      required:
        - capFile
triggers:
  - type: keyword
    pattern: "aircrack"
    priority: 9
  - type: keyword
    pattern: "wifi crack"
    priority: 8
  - type: keyword
    pattern: "wireless"
    priority: 5
  - type: keyword
    pattern: "wpa"
    priority: 8
environment:
  binaries:
    - aircrack-ng
---

# Aircrack-ng Wireless Security Testing

This skill provides an interface to the Aircrack-ng suite for wireless network security testing, including packet capture, deauthentication, and WPA/WPA2/WEP key cracking.

## Usage

- **airmon_start** — Enable monitor mode on a wireless interface.
- **airodump_scan** — Discover wireless networks and capture packets.
- **aireplay_deauth** — Send deauthentication packets to force handshake capture.
- **aircrack_crack** — Crack WPA/WPA2 handshakes with a wordlist.
- **aircrack_wep** — Crack WEP keys from captured initialization vectors.

## Instructions

1. Start by enabling monitor mode on the wireless interface with `airmon_start`.
2. Use `airodump_scan` to discover target networks and capture traffic.
3. If needed, use `aireplay_deauth` to force a client reconnection and capture the WPA handshake.
4. Crack the captured handshake with `aircrack_crack` using a wordlist, or crack WEP with `aircrack_wep`.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the network owner before performing any wireless testing operations. Unauthorized interception of wireless communications or attacks against networks you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

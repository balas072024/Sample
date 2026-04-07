---
name: wireless-tools
version: "1.0.0"
description: "Extended wireless testing — Reaver WPS attacks, Pixie Dust, Kismet, WiFite automated attacks."
author: ArivuClaw
tags:
  - wireless
  - wps
  - reaver
  - kismet
  - wifite
permissions:
  - network.tcp
  - system.process
  - system.admin
  - code.execute
  - unrestricted
tools:
  - name: reaver_wps
    description: WPS brute-force attack using Reaver
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Monitor mode wireless interface
        bssid:
          type: string
          description: Target access point BSSID
        pixieDust:
          type: boolean
          description: Enable Pixie Dust offline WPS attack
        delay:
          type: number
          description: Delay between PIN attempts in seconds
        verbose:
          type: boolean
          description: Enable verbose output
      required:
        - interface
        - bssid
  - name: wifite_auto
    description: Automated wireless attack using WiFite
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Wireless interface to use
        target:
          type: string
          description: Target BSSID or ESSID
        attackWpa:
          type: boolean
          description: Attack WPA/WPA2 networks
        attackWep:
          type: boolean
          description: Attack WEP networks
        attackWps:
          type: boolean
          description: Attack WPS-enabled networks
      required:
        - interface
  - name: kismet_scan
    description: Passive wireless reconnaissance with Kismet
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Wireless interface to use
        outputPrefix:
          type: string
          description: Output file prefix
        duration:
          type: number
          description: Scan duration in seconds
      required:
        - interface
  - name: wifi_deauth
    description: Targeted deauthentication attack
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Monitor mode wireless interface
        bssid:
          type: string
          description: Target access point BSSID
        client:
          type: string
          description: Specific client MAC to deauthenticate
        count:
          type: number
          description: Number of deauth frames to send
        reason:
          type: number
          description: Deauthentication reason code
      required:
        - interface
        - bssid
triggers:
  - type: keyword
    pattern: "reaver"
    priority: 9
  - type: keyword
    pattern: "wps"
    priority: 7
  - type: keyword
    pattern: "wifite"
    priority: 9
  - type: keyword
    pattern: "kismet"
    priority: 9
environment:
  binaries: []
---

# Extended Wireless Testing Tools

This skill provides an interface to extended wireless testing tools including Reaver for WPS attacks, WiFite for automated wireless attacks, and Kismet for passive reconnaissance.

## Usage

- **reaver_wps** — Brute-force WPS PINs or use Pixie Dust for offline WPS cracking.
- **wifite_auto** — Run automated wireless attacks against WPA, WEP, and WPS networks.
- **kismet_scan** — Perform passive wireless reconnaissance and network discovery.
- **wifi_deauth** — Send targeted deauthentication frames to specific clients or broadcast.

## Instructions

1. Ensure the wireless interface is in monitor mode before using these tools.
2. Use `kismet_scan` for passive reconnaissance to identify targets without transmitting.
3. Use `reaver_wps` with the `pixieDust` option first for faster WPS attacks before falling back to brute-force.
4. Use `wifite_auto` for fully automated attack workflows against multiple network types.
5. Use `wifi_deauth` sparingly and only as needed for handshake capture or testing.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the network owner before performing any wireless testing operations. Unauthorized interception of wireless communications or attacks against networks you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

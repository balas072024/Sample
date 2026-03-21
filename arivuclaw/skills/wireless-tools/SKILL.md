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
    description: WPS brute-force attack against a wireless access point
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
          description: Enable WPA/WPA2 attacks
        attackWep:
          type: boolean
          description: Enable WEP attacks
        attackWps:
          type: boolean
          description: Enable WPS attacks
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
          description: Output file prefix for scan results
        duration:
          type: number
          description: Scan duration in seconds
      required:
        - interface
  - name: wifi_deauth
    description: Send targeted deauthentication frames
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
          description: Target client MAC address (omit for broadcast)
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
    value: "reaver"
    priority: 9
  - type: keyword
    value: "wps"
    priority: 7
  - type: keyword
    value: "wifite"
    priority: 9
  - type: keyword
    value: "kismet"
    priority: 9
---

# Extended Wireless Testing Tools

This skill provides an interface to advanced wireless security testing tools including Reaver, WiFite, and Kismet for WPS attacks, automated wireless assessments, and passive reconnaissance.

## Capabilities

- **WPS Brute-Force**: Attack WPS-enabled access points with Reaver, including Pixie Dust offline attacks.
- **Automated Attacks**: Run fully automated wireless attacks with WiFite against WPA, WEP, and WPS targets.
- **Passive Reconnaissance**: Discover and catalog wireless networks with Kismet without active probing.
- **Targeted Deauthentication**: Send deauth frames to specific clients or broadcast to all clients on a network.

## Usage

1. Use `reaver_wps` to attack WPS-enabled access points with PIN brute-force or Pixie Dust.
2. Use `wifite_auto` for automated wireless attacks against multiple targets.
3. Use `kismet_scan` for passive wireless network discovery and reconnaissance.
4. Use `wifi_deauth` to send targeted deauthentication frames.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only use these tools against wireless networks you own or have explicit written permission to test. Unauthorized wireless testing is illegal and may violate federal and local laws. Always obtain proper authorization before conducting any wireless security assessments.

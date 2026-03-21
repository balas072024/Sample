---
name: nmap-scanner
version: "1.0.0"
description: "Network discovery and security auditing with Nmap. Port scanning, service detection, OS fingerprinting, NSE scripts."
author: ArivuClaw
tags:
  - nmap
  - scan
  - ports
  - network
  - recon
  - pentest
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: nmap_scan
    description: "Full Nmap scan with custom flags"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target host, IP, or CIDR range"
        ports:
          type: string
          description: "Port specification (e.g. '22,80,443' or '1-1024')"
        scanType:
          type: string
          enum:
            - quick
            - full
            - stealth
            - udp
            - aggressive
          description: "Type of scan to perform"
        scripts:
          type: array
          items:
            type: string
          description: "NSE scripts to run"
        timing:
          type: string
          enum:
            - T0
            - T1
            - T2
            - T3
            - T4
            - T5
          description: "Timing template (T0=paranoid to T5=insane)"
        outputFormat:
          type: string
          enum:
            - normal
            - xml
            - json
          description: "Output format"
  - name: nmap_service_detect
    description: "Detect services and versions on open ports"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target host or IP"
        ports:
          type: string
          description: "Port specification"
  - name: nmap_os_detect
    description: "OS fingerprinting on a target"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target host or IP"
  - name: nmap_vuln_scan
    description: "Run vulnerability NSE scripts against a target"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target host or IP"
        scripts:
          type: array
          items:
            type: string
          description: "Vulnerability NSE scripts to run"
  - name: nmap_host_discovery
    description: "Discover live hosts on a network"
    inputSchema:
      type: object
      required:
        - subnet
      properties:
        subnet:
          type: string
          description: "Subnet to scan (e.g. '192.168.1.0/24')"
        method:
          type: string
          enum:
            - ping
            - arp
            - syn
          description: "Discovery method"
triggers:
  - type: keyword
    pattern: "nmap"
    priority: 9
  - type: keyword
    pattern: "port scan"
    priority: 8
  - type: keyword
    pattern: "scan network"
    priority: 7
environment:
  binaries:
    - nmap
---

# Nmap Scanner

Network discovery and security auditing skill powered by Nmap.

## Usage

Use this skill to perform port scanning, service detection, OS fingerprinting, and vulnerability assessment with NSE scripts.

### Tools

- **nmap_scan** -- Execute a full Nmap scan with custom flags, timing templates, and output formats. Specify a scan type (`quick`, `full`, `stealth`, `udp`, `aggressive`) to use preconfigured flag sets.
- **nmap_service_detect** -- Probe open ports to determine running services and their versions (`-sV`).
- **nmap_os_detect** -- Attempt to identify the operating system of the target using TCP/IP stack fingerprinting (`-O`).
- **nmap_vuln_scan** -- Run one or more NSE vulnerability scripts (e.g. `vuln`, `exploit`) against a target.
- **nmap_host_discovery** -- Discover live hosts on a subnet using ping, ARP, or SYN probes.

### Examples

1. Quick scan of a single host:
   ```
   nmap_scan target="192.168.1.1" scanType="quick"
   ```

2. Full port scan with service detection:
   ```
   nmap_scan target="10.0.0.0/24" scanType="full" ports="1-65535" timing="T4"
   ```

3. OS fingerprinting:
   ```
   nmap_os_detect target="192.168.1.1"
   ```

4. Vulnerability scan with specific scripts:
   ```
   nmap_vuln_scan target="192.168.1.1" scripts=["vuln", "exploit"]
   ```

5. Host discovery on a subnet:
   ```
   nmap_host_discovery subnet="192.168.1.0/24" method="arp"
   ```

### Notes

- Stealth scans (`-sS`) require root/sudo privileges.
- UDP scans are significantly slower than TCP scans.
- Timing template T5 (insane) may produce unreliable results on congested networks.
- Always ensure you have authorization before scanning any target.

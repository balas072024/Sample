---
name: sublist3r-enum
version: "1.0.0"
description: "Fast subdomain enumeration using multiple search engines and sources."
author: Arivumaiyam AI
tags:
  - sublist3r
  - subdomain
  - enum
  - recon
permissions:
  - network.http
  - system.process
  - code.execute
tools:
  - name: sublist3r_scan
    description: "Enumerate subdomains using multiple search engines"
    inputSchema:
      type: object
      required:
        - domain
      properties:
        domain:
          type: string
          description: "Target domain to enumerate"
        engines:
          type: array
          items:
            type: string
          description: "Search engines to use (e.g. google, bing, yahoo, virustotal)"
        threads:
          type: number
          description: "Number of threads for enumeration"
        bruteforce:
          type: boolean
          description: "Enable brute-force enumeration"
  - name: sublist3r_ports
    description: "Enumerate subdomains and scan specific ports on discovered hosts"
    inputSchema:
      type: object
      required:
        - domain
      properties:
        domain:
          type: string
          description: "Target domain to enumerate"
        ports:
          type: string
          description: "Comma-separated ports to scan on discovered subdomains"
triggers:
  - type: keyword
    pattern: "sublist3r"
    priority: 9
  - type: keyword
    pattern: "subdomains"
    priority: 6
---

# Sublist3r Enum

Fast subdomain enumeration using multiple search engines and data sources.

## Usage

Use this skill to quickly discover subdomains by querying search engines such as Google, Bing, Yahoo, Baidu, and VirusTotal. Optionally scan discovered subdomains for open ports.

### Tools

- **sublist3r_scan** -- Enumerate subdomains for a domain. Optionally specify search engines, thread count, and brute-force mode.
- **sublist3r_ports** -- Enumerate subdomains and then scan specified TCP ports on each discovered host.

### Examples

1. Basic subdomain enumeration:
   ```
   sublist3r_scan domain="example.com"
   ```

2. Enumerate using specific engines with brute-force:
   ```
   sublist3r_scan domain="example.com" engines=["google", "virustotal"] bruteforce=true threads=40
   ```

3. Enumerate subdomains and scan common ports:
   ```
   sublist3r_ports domain="example.com" ports="80,443,8080,8443"
   ```

### Notes

- Some search engines may rate-limit or block automated queries.
- Brute-force mode requires more time but can uncover subdomains not indexed by search engines.
- Ensure you have authorization before enumerating any domain.

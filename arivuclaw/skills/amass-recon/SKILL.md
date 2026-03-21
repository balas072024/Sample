---
name: amass-recon
version: "1.0.0"
description: "In-depth DNS enumeration, subdomain discovery, and attack surface mapping with OWASP Amass."
author: ArivuClaw
tags:
  - amass
  - dns
  - subdomain
  - recon
  - osint
permissions:
  - network.http
  - network.tcp
  - system.process
  - code.execute
tools:
  - name: amass_enum
    description: "Enumerate subdomains for a domain"
    inputSchema:
      type: object
      required:
        - domain
      properties:
        domain:
          type: string
          description: "Target domain to enumerate"
        passive:
          type: boolean
          description: "Use passive data sources only (no active probing)"
        brute:
          type: boolean
          description: "Enable brute-force subdomain enumeration"
        wordlist:
          type: string
          description: "Path to wordlist for brute-force enumeration"
  - name: amass_intel
    description: "Discover domains associated with an organization"
    inputSchema:
      type: object
      required:
        - org
      properties:
        org:
          type: string
          description: "Organization name to investigate"
  - name: amass_track
    description: "Track subdomain changes over time"
    inputSchema:
      type: object
      required:
        - domain
      properties:
        domain:
          type: string
          description: "Domain to track changes for"
  - name: amass_viz
    description: "Generate network visualization from enumeration data"
    inputSchema:
      type: object
      required:
        - domain
      properties:
        domain:
          type: string
          description: "Domain to visualize"
        format:
          type: string
          enum:
            - d3
            - graphistry
            - maltego
          description: "Visualization output format"
triggers:
  - type: keyword
    pattern: "subdomain"
    priority: 8
  - type: keyword
    pattern: "amass"
    priority: 9
  - type: keyword
    pattern: "dns enum"
    priority: 8
environment:
  binaries:
    - amass
---

# Amass Recon

In-depth DNS enumeration, subdomain discovery, and attack surface mapping powered by OWASP Amass.

## Usage

Use this skill to enumerate subdomains, discover organization-owned domains, track changes over time, and generate network visualizations.

### Tools

- **amass_enum** -- Enumerate subdomains for a given domain using passive sources, active probing, or brute-force with a wordlist.
- **amass_intel** -- Discover root domains associated with an organization name, ASN, or CIDR range.
- **amass_track** -- Compare enumeration results over time to identify new or removed subdomains.
- **amass_viz** -- Generate relationship visualizations in D3, Graphistry, or Maltego formats.

### Examples

1. Passive subdomain enumeration:
   ```
   amass_enum domain="example.com" passive=true
   ```

2. Brute-force with a custom wordlist:
   ```
   amass_enum domain="example.com" brute=true wordlist="/usr/share/wordlists/subdomains.txt"
   ```

3. Discover domains for an organization:
   ```
   amass_intel org="Acme Corp"
   ```

4. Track subdomain changes:
   ```
   amass_track domain="example.com"
   ```

5. Generate a D3 visualization:
   ```
   amass_viz domain="example.com" format="d3"
   ```

### Notes

- Passive mode is stealthier but may miss subdomains that active probing would find.
- Brute-force enumeration can be slow depending on wordlist size and target DNS infrastructure.
- Amass stores results in a local database for tracking and comparison across runs.
- Ensure you have authorization before enumerating any domain.

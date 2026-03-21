---
name: gobuster-enum
version: "1.0.0"
description: "Directory, DNS, and virtual host brute-forcing with Gobuster."
author: Arivumaiyam AI
tags:
  - gobuster
  - bruteforce
  - directory
  - dns
  - enum
permissions:
  - network.http
  - system.process
  - code.execute
tools:
  - name: gobuster_dir
    description: "Directory and file brute-force on a web server"
    inputSchema:
      type: object
      required:
        - url
        - wordlist
      properties:
        url:
          type: string
          description: "Target URL to brute-force"
        wordlist:
          type: string
          description: "Path to wordlist file"
        extensions:
          type: string
          description: "File extensions to search for (e.g. 'php,html,txt')"
        threads:
          type: number
          description: "Number of concurrent threads"
        statusCodes:
          type: string
          description: "Status codes to match (e.g. '200,301,302')"
  - name: gobuster_dns
    description: "DNS subdomain brute-force"
    inputSchema:
      type: object
      required:
        - domain
        - wordlist
      properties:
        domain:
          type: string
          description: "Target domain for subdomain brute-force"
        wordlist:
          type: string
          description: "Path to wordlist file"
        resolver:
          type: string
          description: "Custom DNS resolver address"
  - name: gobuster_vhost
    description: "Virtual host brute-force"
    inputSchema:
      type: object
      required:
        - url
        - wordlist
      properties:
        url:
          type: string
          description: "Target URL for virtual host enumeration"
        wordlist:
          type: string
          description: "Path to wordlist file"
  - name: gobuster_fuzz
    description: "Fuzzing mode for custom brute-force patterns"
    inputSchema:
      type: object
      required:
        - url
        - wordlist
      properties:
        url:
          type: string
          description: "Target URL containing the FUZZ keyword"
        wordlist:
          type: string
          description: "Path to wordlist file"
        fuzzKeyword:
          type: string
          description: "Custom keyword to replace in the URL (default: FUZZ)"
triggers:
  - type: keyword
    pattern: "gobuster"
    priority: 9
  - type: keyword
    pattern: "directory brute"
    priority: 7
  - type: keyword
    pattern: "dir scan"
    priority: 7
environment:
  binaries:
    - gobuster
---

# Gobuster Enum

Directory, DNS, and virtual host brute-forcing powered by Gobuster.

## Usage

Use this skill to discover hidden directories and files, brute-force DNS subdomains, enumerate virtual hosts, and fuzz URL patterns.

### Tools

- **gobuster_dir** -- Brute-force directories and files on a web server. Filter by file extensions and HTTP status codes.
- **gobuster_dns** -- Brute-force DNS subdomains for a target domain using a wordlist and optional custom resolver.
- **gobuster_vhost** -- Brute-force virtual hostnames against a target web server.
- **gobuster_fuzz** -- General-purpose fuzzing mode that replaces a keyword in the URL with wordlist entries.

### Examples

1. Directory brute-force with extensions:
   ```
   gobuster_dir url="http://example.com" wordlist="/usr/share/wordlists/dirb/common.txt" extensions="php,html" threads=50
   ```

2. DNS subdomain brute-force:
   ```
   gobuster_dns domain="example.com" wordlist="/usr/share/wordlists/subdomains.txt" resolver="8.8.8.8"
   ```

3. Virtual host enumeration:
   ```
   gobuster_vhost url="http://example.com" wordlist="/usr/share/wordlists/vhosts.txt"
   ```

4. Fuzz a URL parameter:
   ```
   gobuster_fuzz url="http://example.com/api/FUZZ" wordlist="/usr/share/wordlists/api-endpoints.txt"
   ```

### Notes

- Larger wordlists yield better coverage but take longer to complete.
- High thread counts can overwhelm the target; adjust based on network conditions.
- Always ensure you have authorization before brute-forcing any target.

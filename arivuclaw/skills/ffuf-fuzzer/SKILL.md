---
name: ffuf-fuzzer
version: "1.0.0"
description: "Fast web fuzzer for directory discovery, parameter fuzzing, and virtual host enumeration."
author: ArivuClaw
tags:
  - ffuf
  - fuzz
  - web
  - bruteforce
  - discovery
permissions:
  - network.http
  - system.process
  - code.execute
tools:
  - name: ffuf_fuzz
    description: "Run a fuzzing scan against a target URL"
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
        method:
          type: string
          enum:
            - GET
            - POST
          description: "HTTP method to use"
        headers:
          type: object
          description: "Custom HTTP headers as key-value pairs"
        data:
          type: string
          description: "POST data body"
        filterCode:
          type: string
          description: "HTTP status codes to filter out (e.g. '404,403')"
        filterSize:
          type: string
          description: "Response sizes to filter out"
        matchCode:
          type: string
          description: "HTTP status codes to match (e.g. '200,301')"
        threads:
          type: number
          description: "Number of concurrent threads"
        rate:
          type: number
          description: "Rate limit (requests per second)"
  - name: ffuf_recursive
    description: "Recursive directory discovery"
    inputSchema:
      type: object
      required:
        - url
        - wordlist
      properties:
        url:
          type: string
          description: "Target base URL"
        wordlist:
          type: string
          description: "Path to wordlist file"
        depth:
          type: number
          description: "Recursion depth"
        extensions:
          type: string
          description: "File extensions to append (e.g. 'php,html,js')"
triggers:
  - type: keyword
    pattern: "ffuf"
    priority: 9
  - type: keyword
    pattern: "fuzz"
    priority: 7
environment:
  binaries:
    - ffuf
---

# FFUF Fuzzer

Fast web fuzzer for directory discovery, parameter fuzzing, and virtual host enumeration.

## Usage

Use this skill to fuzz web applications for hidden directories, files, parameters, and virtual hosts. FFUF is highly configurable with filtering, matching, and rate-limiting options.

### Tools

- **ffuf_fuzz** -- Run a fuzzing scan by replacing the FUZZ keyword in the URL with wordlist entries. Supports custom headers, POST data, response filtering, and rate limiting.
- **ffuf_recursive** -- Perform recursive directory discovery, automatically descending into found directories up to a specified depth.

### Examples

1. Basic directory fuzzing:
   ```
   ffuf_fuzz url="http://example.com/FUZZ" wordlist="/usr/share/wordlists/dirb/common.txt"
   ```

2. POST parameter fuzzing with filtering:
   ```
   ffuf_fuzz url="http://example.com/login" wordlist="/usr/share/wordlists/passwords.txt" method="POST" data="user=admin&pass=FUZZ" filterCode="401"
   ```

3. Virtual host fuzzing with custom headers:
   ```
   ffuf_fuzz url="http://example.com" wordlist="/usr/share/wordlists/vhosts.txt" headers={"Host": "FUZZ.example.com"}
   ```

4. Recursive directory discovery:
   ```
   ffuf_recursive url="http://example.com/FUZZ" wordlist="/usr/share/wordlists/common.txt" depth=3 extensions="php,html"
   ```

5. Rate-limited fuzzing:
   ```
   ffuf_fuzz url="http://example.com/FUZZ" wordlist="/usr/share/wordlists/big.txt" rate=100 threads=10
   ```

### Notes

- The URL must contain the FUZZ keyword where substitution should occur.
- Use filters (`filterCode`, `filterSize`) to reduce noise from irrelevant responses.
- Rate limiting prevents overwhelming the target and avoids detection by WAFs.
- Always ensure you have authorization before fuzzing any target.

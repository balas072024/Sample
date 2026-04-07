---
name: nuclei-scanner
version: "1.0.0"
description: "Fast vulnerability scanner using community-powered templates. CVE detection, misconfigurations, exposed panels."
author: ArivuClaw
tags:
  - nuclei
  - vulnerability
  - scanner
  - cve
  - templates
permissions:
  - network.http
  - network.tcp
  - system.process
  - code.execute
tools:
  - name: nuclei_scan
    description: "Run a Nuclei scan against target(s)"
    inputSchema:
      type: object
      required:
        - target
      properties:
        target:
          type: string
          description: "Target URL, host, or file containing targets"
        templates:
          type: array
          items:
            type: string
          description: "Specific templates or template directories to use"
        severity:
          type: string
          enum:
            - info
            - low
            - medium
            - high
            - critical
          description: "Filter templates by severity level"
        tags:
          type: array
          items:
            type: string
          description: "Filter templates by tags (e.g. cve, rce, lfi)"
        excludeTags:
          type: array
          items:
            type: string
          description: "Tags to exclude from the scan"
        rateLimit:
          type: number
          description: "Maximum requests per second"
        output:
          type: string
          description: "Output file path for scan results"
  - name: nuclei_templates
    description: "Manage Nuclei templates"
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum:
            - list
            - update
            - search
          description: "Template management action"
        query:
          type: string
          description: "Search query for templates"
  - name: nuclei_workflow
    description: "Run a Nuclei workflow against a target"
    inputSchema:
      type: object
      required:
        - target
        - workflow
      properties:
        target:
          type: string
          description: "Target URL or host"
        workflow:
          type: string
          description: "Path to workflow file or workflow name"
triggers:
  - type: keyword
    pattern: "nuclei"
    priority: 9
  - type: keyword
    pattern: "vulnerability scan"
    priority: 7
  - type: keyword
    pattern: "cve scan"
    priority: 8
environment:
  binaries:
    - nuclei
---

# Nuclei Scanner

Fast vulnerability scanner using community-powered templates for CVE detection, misconfiguration identification, and exposed panel discovery.

## Usage

Use this skill to scan targets for known vulnerabilities, misconfigurations, and security issues using Nuclei's extensive template library.

### Tools

- **nuclei_scan** -- Run a Nuclei scan against one or more targets. Filter by severity, tags, and specific templates. Control scan speed with rate limiting.
- **nuclei_templates** -- List, update, or search the Nuclei template repository.
- **nuclei_workflow** -- Execute a Nuclei workflow that chains multiple templates together for comprehensive scanning.

### Examples

1. Scan a target with all templates:
   ```
   nuclei_scan target="https://example.com"
   ```

2. Scan for critical and high severity vulnerabilities:
   ```
   nuclei_scan target="https://example.com" severity="critical" tags=["cve", "rce"]
   ```

3. Scan with specific templates and rate limiting:
   ```
   nuclei_scan target="https://example.com" templates=["cves/", "misconfigurations/"] rateLimit=100 output="/tmp/nuclei-results.txt"
   ```

4. Update templates to the latest version:
   ```
   nuclei_templates action="update"
   ```

5. Search for templates related to a specific technology:
   ```
   nuclei_templates action="search" query="wordpress"
   ```

6. Run a workflow:
   ```
   nuclei_workflow target="https://example.com" workflow="workflows/wordpress-workflow.yaml"
   ```

### Notes

- Keep templates updated regularly for the latest vulnerability checks.
- Use severity and tag filters to focus scans and reduce noise.
- Rate limiting is recommended to avoid overwhelming targets or triggering WAFs.
- Workflows chain templates together for technology-specific comprehensive scanning.
- Always ensure you have authorization before scanning any target.

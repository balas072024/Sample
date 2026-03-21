---
name: recon-ng
version: "1.0.0"
description: "Full-featured reconnaissance framework. Modules for OSINT, DNS, contacts, credentials."
author: Arivumaiyam AI
tags:
  - recon-ng
  - osint
  - recon
  - framework
permissions:
  - network.http
  - system.process
  - code.execute
  - database.query
tools:
  - name: recon_run_module
    description: "Run a recon-ng module with specified options"
    inputSchema:
      type: object
      required:
        - module
      properties:
        module:
          type: string
          description: "Full module path (e.g. 'recon/domains-hosts/hackertarget')"
        options:
          type: object
          description: "Key-value pairs for module options"
        domain:
          type: string
          description: "Target domain"
  - name: recon_list_modules
    description: "List available modules by category"
    inputSchema:
      type: object
      properties:
        category:
          type: string
          enum:
            - recon
            - discovery
            - reporting
            - import
            - exploitation
          description: "Module category to list"
  - name: recon_workspace
    description: "Manage recon-ng workspaces"
    inputSchema:
      type: object
      properties:
        action:
          type: string
          enum:
            - create
            - list
            - use
            - delete
          description: "Workspace action"
        name:
          type: string
          description: "Workspace name"
  - name: recon_report
    description: "Generate a report from workspace data"
    inputSchema:
      type: object
      properties:
        format:
          type: string
          enum:
            - html
            - csv
            - json
            - xlsx
          description: "Report output format"
        workspace:
          type: string
          description: "Workspace to generate report from"
triggers:
  - type: keyword
    pattern: "recon-ng"
    priority: 9
  - type: keyword
    pattern: "osint"
    priority: 6
environment:
  binaries:
    - recon-ng
---

# Recon-ng

Full-featured reconnaissance framework with modules for OSINT, DNS enumeration, contact discovery, and credential harvesting.

## Usage

Use this skill to run recon-ng modules, manage workspaces, and generate reports from collected intelligence data.

### Tools

- **recon_run_module** -- Execute a recon-ng module with custom options. Specify the full module path and any required options.
- **recon_list_modules** -- List available modules filtered by category (recon, discovery, reporting, import, exploitation).
- **recon_workspace** -- Create, list, switch between, or delete workspaces to organize investigations.
- **recon_report** -- Generate reports in HTML, CSV, JSON, or XLSX format from workspace data.

### Examples

1. Run a domain-to-hosts module:
   ```
   recon_run_module module="recon/domains-hosts/hackertarget" domain="example.com"
   ```

2. List all recon modules:
   ```
   recon_list_modules category="recon"
   ```

3. Create a new workspace:
   ```
   recon_workspace action="create" name="project-alpha"
   ```

4. Generate an HTML report:
   ```
   recon_report format="html" workspace="project-alpha"
   ```

### Notes

- Some modules require API keys (e.g. Shodan, VirusTotal). Configure keys before use.
- Workspaces isolate data between different investigations.
- Use the reporting modules to export findings for documentation.
- Ensure you have authorization before performing reconnaissance on any target.

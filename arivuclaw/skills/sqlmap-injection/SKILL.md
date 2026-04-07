---
name: sqlmap-injection
version: "1.0.0"
description: "Automatic SQL injection detection and exploitation. Database takeover, data extraction, OS access."
author: ArivuClaw
tags:
  - sqlmap
  - sql
  - injection
  - database
  - pentest
permissions:
  - network.http
  - system.process
  - code.execute
  - database.query
  - unrestricted
tools:
  - name: sqlmap_scan
    description: Test a URL for SQL injection.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL with injectable parameters.
        data:
          type: string
          description: POST data string.
        method:
          type: string
          enum:
            - GET
            - POST
          description: HTTP method.
        cookie:
          type: string
          description: HTTP cookie header value.
        level:
          type: number
          minimum: 1
          maximum: 5
          description: Level of tests to perform (1-5).
        risk:
          type: number
          minimum: 1
          maximum: 3
          description: Risk of tests to perform (1-3).
        technique:
          type: string
          description: SQL injection techniques to test (e.g. BEUSTQ).
        dbms:
          type: string
          description: Force back-end DBMS to specified value.
        tamper:
          type: array
          items:
            type: string
          description: Tamper scripts to apply.
        threads:
          type: number
          description: Number of concurrent threads.
  - name: sqlmap_dump
    description: Dump database tables.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL with injectable parameters.
        database:
          type: string
          description: Database name to dump from.
        table:
          type: string
          description: Table name to dump.
        columns:
          type: array
          items:
            type: string
          description: Specific columns to dump.
        dumpAll:
          type: boolean
          description: Dump all databases, tables, and columns.
  - name: sqlmap_enum
    description: Enumerate databases, tables, columns.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL with injectable parameters.
        action:
          type: string
          enum:
            - dbs
            - tables
            - columns
            - schema
            - count
          description: Enumeration action to perform.
        database:
          type: string
          description: Database name for table/column enumeration.
        table:
          type: string
          description: Table name for column enumeration.
  - name: sqlmap_os
    description: OS-level access via SQL injection.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL with injectable parameters.
        action:
          type: string
          enum:
            - shell
            - command
            - file-read
            - file-write
          description: OS-level action to perform.
        command:
          type: string
          description: OS command to execute.
        filePath:
          type: string
          description: File path for read/write operations.
  - name: sqlmap_identify
    description: Identify injection points in a request.
    inputSchema:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: Target URL.
        data:
          type: string
          description: POST data string.
        headers:
          type: object
          description: Custom HTTP headers as key-value pairs.
        forms:
          type: boolean
          description: Automatically test forms found on the page.
triggers:
  - type: keyword
    value: sqlmap
    priority: 9
  - type: keyword
    value: sql injection
    priority: 8
  - type: keyword
    value: sqli
    priority: 8
environment:
  binaries:
    - sqlmap
---

# SQLMap Injection

This skill provides automated SQL injection detection and exploitation capabilities using SQLMap, including database enumeration, data extraction, and OS-level access.

## Capabilities

- **sqlmap_scan** — Test target URLs for SQL injection vulnerabilities with configurable levels, risk, techniques, and tamper scripts.
- **sqlmap_dump** — Extract data from database tables, including the ability to dump entire databases.
- **sqlmap_enum** — Enumerate databases, tables, columns, schemas, and row counts on the target system.
- **sqlmap_os** — Gain OS-level access through SQL injection for command execution and file read/write operations.
- **sqlmap_identify** — Identify injectable parameters in URLs, POST data, headers, and forms.

## Instructions

1. Start with `sqlmap_identify` or `sqlmap_scan` to discover injection points on the target.
2. Use `sqlmap_enum` to map out the database structure before extracting data.
3. Use `sqlmap_dump` to extract specific tables or columns of interest.
4. Use `sqlmap_os` for OS-level access only when required and authorized.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

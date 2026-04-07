---
name: database
version: "1.0.0"
description: Query and manage databases — SQLite, PostgreSQL, MySQL, MongoDB, Redis.
author: ArivuClaw
tags:
  - database
  - sql
  - sqlite
  - postgres
  - mysql
  - mongodb
  - redis
permissions:
  - database.query
  - network.http
tools:
  - name: db_query
    description: Execute a SQL query on a connected database
    permissions: [database.query]
    inputSchema:
      type: object
      properties:
        query: { type: string, description: "SQL query to execute" }
        database: { type: string, description: "Database connection name" }
        params: { type: array, description: "Query parameters for prepared statements" }
      required: [query]
  - name: db_connect
    description: Connect to a database
    permissions: [database.query, network.http]
    inputSchema:
      type: object
      properties:
        type: { type: string, enum: [sqlite, postgres, mysql, mongodb, redis] }
        connectionString: { type: string }
        name: { type: string, description: "Connection alias" }
      required: [type, connectionString]
  - name: db_tables
    description: List tables/collections in the database
    permissions: [database.query]
    inputSchema:
      type: object
      properties:
        database: { type: string }
  - name: db_schema
    description: Show schema/structure of a table
    permissions: [database.query]
    inputSchema:
      type: object
      properties:
        table: { type: string }
        database: { type: string }
      required: [table]
  - name: db_export
    description: Export query results to CSV or JSON
    permissions: [database.query, filesystem.write]
    inputSchema:
      type: object
      properties:
        query: { type: string }
        format: { type: string, enum: [csv, json] }
        outputPath: { type: string }
        database: { type: string }
      required: [query, format, outputPath]
triggers:
  - type: keyword
    pattern: database
    priority: 8
  - type: keyword
    pattern: sql
    priority: 9
  - type: keyword
    pattern: query
    priority: 5
  - type: keyword
    pattern: sqlite
    priority: 9
  - type: keyword
    pattern: postgres
    priority: 9
  - type: keyword
    pattern: mongodb
    priority: 9
---

# Database Skill

Query and manage any database directly from ArivuClaw.

## Supported Databases
- **SQLite** — File-based, zero config
- **PostgreSQL** — Full SQL with extensions
- **MySQL/MariaDB** — Common web database
- **MongoDB** — Document store (NoSQL)
- **Redis** — Key-value store

## Safety
- Uses parameterized queries to prevent SQL injection
- Wraps destructive operations (DROP, DELETE, TRUNCATE) in confirmations in restricted mode
- In unrestricted mode, all queries execute directly

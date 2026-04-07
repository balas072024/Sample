---
name: bloodhound-ad
version: "1.0.0"
description: Active Directory attack path discovery and privilege escalation analysis with BloodHound.
author: ArivuClaw
tags:
  - bloodhound
  - active-directory
  - ad
  - privilege
  - lateral-movement
permissions:
  - network.tcp
  - system.process
  - code.execute
  - unrestricted
tools:
  - name: bloodhound_collect
    description: Run SharpHound/BloodHound collector
    inputSchema:
      type: object
      properties:
        method:
          type: string
          enum: [sharphound, bloodhound-python]
          description: Collection method to use
        domain:
          type: string
          description: Target Active Directory domain
        username:
          type: string
          description: Domain username for authentication
        password:
          type: string
          description: Domain password for authentication
        collectionMethod:
          type: string
          enum: [All, Default, Session, ACL, ObjectProps, Group, LocalAdmin, DCOnly]
          description: BloodHound collection method
        outputDir:
          type: string
          description: Output directory for collected data
      required: [method, domain]
  - name: bloodhound_import
    description: Import collected data into BloodHound
    inputSchema:
      type: object
      properties:
        dataFile:
          type: string
          description: Path to collected data file (JSON/ZIP)
        neo4jUrl:
          type: string
          description: Neo4j database URL
        neo4jUser:
          type: string
          description: Neo4j username
        neo4jPass:
          type: string
          description: Neo4j password
      required: [dataFile]
  - name: bloodhound_query
    description: Run Cypher queries against BloodHound
    inputSchema:
      type: object
      properties:
        query:
          type: string
          description: Cypher query to execute
        neo4jUrl:
          type: string
          description: Neo4j database URL
      required: [query]
  - name: bloodhound_paths
    description: Find shortest attack paths
    inputSchema:
      type: object
      properties:
        startNode:
          type: string
          description: Starting node (user/computer)
        endNode:
          type: string
          description: Target node (user/group/computer)
        pathType:
          type: string
          enum: [shortest, all]
          description: Type of path search
      required: [startNode, endNode]
triggers:
  - type: keyword
    pattern: bloodhound
    priority: 9
  - type: keyword
    pattern: active directory
    priority: 7
  - type: keyword
    pattern: attack path
    priority: 7
---

# BloodHound AD — Active Directory Attack Path Discovery

This skill provides Active Directory attack path discovery and privilege escalation analysis using BloodHound and SharpHound collectors.

## Capabilities

- **Data Collection**: Run SharpHound or BloodHound-Python collectors to enumerate AD objects, ACLs, sessions, group memberships, and trusts.
- **Data Import**: Import collected JSON/ZIP data into the BloodHound Neo4j database for graph-based analysis.
- **Cypher Queries**: Execute custom Cypher queries against the BloodHound database to identify misconfigurations and attack vectors.
- **Attack Path Discovery**: Find shortest and all attack paths between any two AD principals (users, groups, computers).

## Usage

1. Collect AD data using `bloodhound_collect` with the appropriate method and domain.
2. Import the results with `bloodhound_import`.
3. Query the graph with `bloodhound_query` or find attack paths with `bloodhound_paths`.

## Requirements

- SharpHound (.exe or .ps1) or BloodHound-Python installed
- Neo4j database running for BloodHound
- Valid domain credentials for collection

## Authorized Use Only

This skill is intended exclusively for authorized penetration testing and red team engagements. Always obtain explicit written permission before collecting Active Directory data or performing any enumeration against a target environment. Unauthorized use of this skill against systems you do not own or have permission to test is illegal and unethical.

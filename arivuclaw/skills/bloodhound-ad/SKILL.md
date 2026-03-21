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
      required:
        - method
        - domain
      properties:
        method:
          type: string
          enum:
            - sharphound
            - bloodhound-python
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
          enum:
            - All
            - Default
            - Session
            - ACL
            - ObjectProps
            - Group
            - LocalAdmin
            - DCOnly
          description: BloodHound collection method
        outputDir:
          type: string
          description: Output directory for collected data
  - name: bloodhound_import
    description: Import collected data into BloodHound
    inputSchema:
      type: object
      required:
        - dataFile
      properties:
        dataFile:
          type: string
          description: Path to the collected data file
        neo4jUrl:
          type: string
          description: Neo4j database URL
        neo4jUser:
          type: string
          description: Neo4j username
        neo4jPass:
          type: string
          description: Neo4j password
  - name: bloodhound_query
    description: Run Cypher queries against BloodHound
    inputSchema:
      type: object
      required:
        - query
      properties:
        query:
          type: string
          description: Cypher query to execute
        neo4jUrl:
          type: string
          description: Neo4j database URL
  - name: bloodhound_paths
    description: Find shortest attack paths
    inputSchema:
      type: object
      required:
        - startNode
        - endNode
      properties:
        startNode:
          type: string
          description: Starting node for path analysis
        endNode:
          type: string
          description: Target end node
        pathType:
          type: string
          enum:
            - shortest
            - all
          description: Type of path search
triggers:
  - type: keyword
    value: bloodhound
    priority: 9
  - type: keyword
    value: active directory
    priority: 7
  - type: keyword
    value: attack path
    priority: 7
---

# BloodHound AD — Active Directory Attack Path Discovery

This skill provides Active Directory attack path discovery and privilege escalation analysis using BloodHound and SharpHound collectors. It enables enumeration of AD relationships, identification of misconfigurations, and mapping of lateral movement paths.

## Capabilities

- **Data Collection**: Run SharpHound or BloodHound-Python collectors to gather AD relationship data including group memberships, sessions, ACLs, and trust relationships.
- **Data Import**: Import collected JSON/ZIP data into the BloodHound Neo4j database for graph-based analysis.
- **Cypher Queries**: Execute custom Cypher queries against the BloodHound database to identify specific attack patterns and misconfigurations.
- **Path Analysis**: Find shortest and all possible attack paths between any two nodes in the AD environment.

## Usage

1. Collect AD data using `bloodhound_collect` with the appropriate method and domain.
2. Import the collected data with `bloodhound_import`.
3. Query the database with `bloodhound_query` or find attack paths with `bloodhound_paths`.

## Authorization Notice

This skill is intended for **authorized security testing and penetration testing engagements only**. You must have explicit written permission from the system owner before running any Active Directory enumeration or attack path analysis. Unauthorized use of these tools against systems you do not own or have permission to test is illegal and unethical. Always operate within the scope of your engagement and comply with all applicable laws and regulations.

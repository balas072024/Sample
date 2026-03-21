---
name: wireshark-capture
version: "1.0.0"
description: "Network packet capture and analysis with tshark/Wireshark. Protocol analysis, filtering, extraction."
author: ArivuClaw
tags:
  - wireshark
  - tshark
  - pcap
  - packet
  - capture
  - network
permissions:
  - network.tcp
  - system.process
  - system.admin
  - code.execute
  - unrestricted
tools:
  - name: tshark_capture
    description: Capture network packets from an interface
    inputSchema:
      type: object
      properties:
        interface:
          type: string
          description: Network interface to capture on
        filter:
          type: string
          description: BPF capture filter expression
        duration:
          type: number
          description: Capture duration in seconds
        count:
          type: number
          description: Maximum number of packets to capture
        outputFile:
          type: string
          description: Output PCAP file path
      required:
        - interface
  - name: tshark_read
    description: Read and analyze a PCAP file
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the PCAP file to analyze
        displayFilter:
          type: string
          description: Wireshark display filter expression
        fields:
          type: array
          items:
            type: string
          description: Specific fields to extract (e.g., ip.src, tcp.port)
        format:
          type: string
          enum:
            - text
            - json
            - pdml
          description: Output format
      required:
        - file
  - name: tshark_extract
    description: Extract data from a capture file (files, images, credentials, streams)
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the PCAP file
        extractType:
          type: string
          enum:
            - http
            - ftp
            - smb
            - dns
            - streams
            - objects
          description: Type of data to extract
      required:
        - file
        - extractType
  - name: tshark_stats
    description: Generate traffic statistics from a capture file
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the PCAP file
        statType:
          type: string
          enum:
            - endpoints
            - conversations
            - protocols
            - io
          description: Type of statistics to generate
      required:
        - file
        - statType
  - name: tshark_follow
    description: Follow a TCP/UDP/HTTP stream in a capture file
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the PCAP file
        streamType:
          type: string
          enum:
            - tcp
            - udp
            - http
          description: Type of stream to follow
        streamIndex:
          type: number
          description: Index of the stream to follow
      required:
        - file
        - streamIndex
triggers:
  - type: keyword
    value: "wireshark"
    priority: 9
  - type: keyword
    value: "tshark"
    priority: 9
  - type: keyword
    value: "packet capture"
    priority: 8
  - type: keyword
    value: "pcap"
    priority: 8
  - type: keyword
    value: "sniff"
    priority: 7
environment:
  binaries:
    - tshark
---

# Wireshark / tshark Packet Capture & Analysis

This skill provides an interface to tshark (the command-line version of Wireshark) for network packet capture, protocol analysis, data extraction, and traffic statistics.

## Capabilities

- **Packet Capture**: Capture live network traffic with BPF filters on any interface.
- **PCAP Analysis**: Read and filter captured traffic with powerful display filters.
- **Data Extraction**: Extract HTTP objects, FTP transfers, SMB files, DNS queries, and stream data.
- **Traffic Statistics**: Generate endpoint, conversation, protocol hierarchy, and I/O statistics.
- **Stream Following**: Reassemble and follow TCP, UDP, or HTTP streams.

## Usage

1. Use `tshark_capture` to capture live traffic from a network interface.
2. Use `tshark_read` to analyze PCAP files with display filters and field extraction.
3. Use `tshark_extract` to pull files, credentials, and objects from captures.
4. Use `tshark_stats` to generate traffic statistics and summaries.
5. Use `tshark_follow` to follow and reconstruct individual network streams.

## Authorized Testing Only

This skill is intended exclusively for authorized security testing and educational purposes. Only capture and analyze network traffic on networks you own or have explicit written permission to monitor. Unauthorized packet capture may violate wiretapping and privacy laws. Always obtain proper authorization and follow applicable regulations before conducting any network capture activities.

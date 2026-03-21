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
    description: Capture network packets on an interface
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
          description: Path to the PCAP file
        displayFilter:
          type: string
          description: Wireshark display filter expression
        fields:
          type: array
          items:
            type: string
          description: Specific fields to extract
        format:
          type: string
          enum: [text, json, pdml]
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
          enum: [http, ftp, smb, dns, streams, objects]
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
          enum: [endpoints, conversations, protocols, io]
          description: Type of statistics to generate
      required:
        - file
        - statType
  - name: tshark_follow
    description: Follow a TCP, UDP, or HTTP stream from a capture
    inputSchema:
      type: object
      properties:
        file:
          type: string
          description: Path to the PCAP file
        streamType:
          type: string
          enum: [tcp, udp, http]
          description: Type of stream to follow
        streamIndex:
          type: number
          description: Index of the stream to follow
      required:
        - file
        - streamType
        - streamIndex
triggers:
  - type: keyword
    pattern: "wireshark"
    priority: 9
  - type: keyword
    pattern: "tshark"
    priority: 9
  - type: keyword
    pattern: "packet capture"
    priority: 8
  - type: keyword
    pattern: "pcap"
    priority: 8
  - type: keyword
    pattern: "sniff"
    priority: 7
environment:
  binaries:
    - tshark
---

# Wireshark/tshark Packet Capture & Analysis

This skill provides an interface to tshark (the command-line version of Wireshark) for network packet capture, protocol analysis, data extraction, and traffic statistics.

## Usage

- **tshark_capture** — Capture live network packets with optional BPF filters.
- **tshark_read** — Read and analyze PCAP files with display filters and field extraction.
- **tshark_extract** — Extract embedded files, credentials, DNS queries, and streams from captures.
- **tshark_stats** — Generate endpoint, conversation, protocol, and I/O statistics.
- **tshark_follow** — Follow and reconstruct TCP, UDP, or HTTP streams.

## Instructions

1. Use `tshark_capture` to capture live traffic on the target interface with appropriate filters.
2. Analyze captured traffic with `tshark_read` using display filters to focus on relevant packets.
3. Extract embedded objects and credentials with `tshark_extract`.
4. Generate traffic overviews with `tshark_stats` to identify top talkers and protocols.
5. Reconstruct full communication streams with `tshark_follow` for detailed analysis.

## Authorized Testing Only

This skill is intended exclusively for use in authorized security testing and penetration testing engagements. You must have explicit written permission from the network owner before capturing network traffic. Unauthorized packet capture and network sniffing is illegal and unethical. Always operate within the scope of your engagement and applicable laws.

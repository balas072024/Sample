---
name: crypto-wallet
version: "1.0.0"
description: Check cryptocurrency prices, portfolio tracking, and wallet balance monitoring.
author: Arivumaiyam AI
tags: [crypto, bitcoin, ethereum, portfolio, price]
permissions: [network.http, memory.read, memory.write]
tools:
  - name: crypto_price
    description: Get current price of a cryptocurrency
    permissions: [network.http]
    inputSchema:
      type: object
      properties:
        symbol: { type: string, description: "Crypto symbol (e.g. BTC, ETH, SOL)" }
        currency: { type: string, description: "Fiat currency (default: USD)" }
      required: [symbol]
  - name: crypto_portfolio
    description: Track your crypto portfolio value
    permissions: [network.http, memory.read]
    inputSchema:
      type: object
      properties: {}
  - name: crypto_alert
    description: Set a price alert for a cryptocurrency
    permissions: [network.http, schedule.create, memory.write]
    inputSchema:
      type: object
      properties:
        symbol: { type: string }
        targetPrice: { type: number }
        direction: { type: string, enum: [above, below] }
      required: [symbol, targetPrice, direction]
triggers:
  - type: keyword
    pattern: bitcoin
    priority: 8
  - type: keyword
    pattern: crypto
    priority: 8
  - type: keyword
    pattern: ethereum
    priority: 8
  - type: keyword
    pattern: price of
    priority: 4
---

# Crypto Wallet Skill

Track cryptocurrency prices and portfolio using free CoinGecko API.
No API key required for basic price checks.

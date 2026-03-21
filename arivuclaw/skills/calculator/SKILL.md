---
name: calculator
version: 1.0.0
description: Performs math calculations, unit conversions, and formula evaluations with precision control.
author: Arivumaiyam AI
tags:
  - utility
  - math
  - calculator
  - conversion
permissions: []
tools:
  - name: calculate
    description: Evaluates a mathematical expression and returns the result.
    permissions: []
    inputSchema:
      type: object
      properties:
        expression:
          type: string
          description: Mathematical expression to evaluate (e.g., "2^10 + sqrt(144)").
        precision:
          type: integer
          description: Decimal places for the result.
          default: 10
        mode:
          type: string
          enum: [decimal, fraction, scientific]
          description: Output format for the result.
          default: decimal
      required:
        - expression
  - name: convert_units
    description: Converts a value from one unit to another.
    permissions: []
    inputSchema:
      type: object
      properties:
        value:
          type: number
          description: The numeric value to convert.
        from_unit:
          type: string
          description: Source unit (e.g., "km", "lbs", "celsius").
        to_unit:
          type: string
          description: Target unit (e.g., "miles", "kg", "fahrenheit").
      required:
        - value
        - from_unit
        - to_unit
  - name: solve_formula
    description: Solves a named formula or equation for a specified variable.
    permissions: []
    inputSchema:
      type: object
      properties:
        formula:
          type: string
          description: The formula or equation (e.g., "F = m * a").
        solve_for:
          type: string
          description: Variable to solve for.
        known_values:
          type: object
          description: Known variable values as key-value pairs.
      required:
        - formula
        - solve_for
        - known_values
triggers:
  - pattern: "calculate {expression}"
  - pattern: "convert {value} {from} to {to}"
  - pattern: "solve {formula}"
  - pattern: "what is {expression}"
---

# Calculator

Performs math calculations, unit conversions, and formula evaluations with configurable precision and output formats.

## Usage

```
calculate 2^10 + sqrt(144)
convert 100 km to miles
solve F = m * a for m
what is 15% of 230
```

## Features

- Mathematical expression evaluation with operator precedence
- Configurable precision and output format (decimal, fraction, scientific)
- Unit conversion across length, weight, temperature, volume, and more
- Formula solving for any variable

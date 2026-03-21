---
name: social-engineer
version: "1.0.0"
description: "Social Engineering Toolkit (SET) — phishing simulations, credential harvesting for authorized security awareness testing."
author: ArivuClaw
tags:
  - set
  - phishing
  - social-engineering
  - awareness
permissions:
  - network.http
  - system.process
  - code.execute
  - email.send
  - unrestricted
tools:
  - name: set_phishing
    description: Create a phishing simulation page.
    inputSchema:
      type: object
      required:
        - templateUrl
      properties:
        templateUrl:
          type: string
          description: URL of the page to clone as a phishing template.
        redirectUrl:
          type: string
          description: URL to redirect to after credential capture.
        serverPort:
          type: number
          description: Port for the phishing server.
        description:
          type: string
          description: Description of the phishing simulation scenario.
  - name: set_credential_harvest
    description: Set up credential harvesting server for testing.
    inputSchema:
      type: object
      required:
        - cloneUrl
      properties:
        cloneUrl:
          type: string
          description: URL of the login page to clone.
        port:
          type: number
          description: Port to run the harvesting server on.
  - name: set_email_campaign
    description: Create a security awareness email campaign.
    inputSchema:
      type: object
      properties:
        template:
          type: string
          description: Email template content or path to template file.
        targets:
          type: array
          items:
            type: string
          description: List of target email addresses.
        fromAddress:
          type: string
          description: Sender email address.
        subject:
          type: string
          description: Email subject line.
  - name: set_report
    description: Generate a social engineering test report.
    inputSchema:
      type: object
      properties:
        campaignId:
          type: string
          description: Campaign ID to generate a report for.
        format:
          type: string
          enum:
            - pdf
            - html
            - json
          description: Report output format.
triggers:
  - type: keyword
    value: social engineer
    priority: 8
  - type: keyword
    value: phishing
    priority: 7
  - type: keyword
    value: SET
    priority: 8
---

# Social Engineer

This skill provides integration with the Social Engineering Toolkit (SET) for conducting authorized phishing simulations, credential harvesting tests, and security awareness campaigns.

## Capabilities

- **set_phishing** — Clone a target website and host it as a phishing simulation page with configurable redirect and server settings.
- **set_credential_harvest** — Deploy a credential harvesting server that clones a login page to test user susceptibility to phishing attacks.
- **set_email_campaign** — Create and send security awareness email campaigns with custom templates to a list of target addresses.
- **set_report** — Generate comprehensive reports on social engineering campaign results for stakeholder review.

## Instructions

1. Obtain explicit written authorization before conducting any social engineering tests.
2. Use `set_phishing` or `set_credential_harvest` to set up the simulation infrastructure.
3. Use `set_email_campaign` to deliver the phishing simulation to authorized targets.
4. Generate reports with `set_report` to document findings and provide security awareness recommendations.

## Disclaimer

This skill is intended for **authorized security testing**, **CTF competitions**, and **educational purposes only**. Unauthorized use of these tools against systems you do not own or have explicit written permission to test is illegal and unethical. Social engineering tests require explicit written authorization from the target organization. Always operate within the bounds of applicable laws, regulations, and engagement agreements.

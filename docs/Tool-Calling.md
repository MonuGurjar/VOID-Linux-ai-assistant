# Tool Calling System

## Project

**VOID — Intelligent Linux AI Assistant**

**Version:** 1.0

---

# Overview

The Tool Calling System enables VOID to interact with the operating system and external services through controlled, permission-aware tools.

Rather than allowing the language model to execute arbitrary commands, the model generates structured tool requests. The Orchestrator validates those requests, selects the appropriate tool, performs permission checks, executes the operation, and returns structured results.

This architecture ensures every system interaction is transparent, auditable, and secure.

---

# Design Goals

The Tool Calling System should be:

* Secure
* Deterministic
* Modular
* Replaceable
* Observable
* Permission-aware
* Extensible

---

# High-Level Architecture

```text
                  User Request
                       │
                       ▼
                 AI Pipeline
                       │
                       ▼
                 Request Orchestrator
                       │
                       ▼
              Tool Decision Engine
                       │
                       ▼
              Permission Manager
                       │
                       ▼
                 Tool Manager
                       │
      ┌────────────────┼─────────────────┐
      │                │                 │
      ▼                ▼                 ▼
Filesystem Tool   Linux Tool      External API Tool
      │                │                 │
      └────────────────┼─────────────────┘
                       ▼
              Structured Result
                       │
                       ▼
               Response Generator
                       │
                       ▼
                      User
```

---

# Tool Lifecycle

Every tool execution follows the same sequence.

```text
User Request
      │
      ▼
Intent Detection
      │
      ▼
Planning
      │
      ▼
Tool Selection
      │
      ▼
Permission Check
      │
      ▼
Input Validation
      │
      ▼
Execution
      │
      ▼
Structured Result
      │
      ▼
LLM Explanation
      │
      ▼
User
```

No tool may bypass this lifecycle.

---

# Tool Categories

## Linux System

Examples

* system information
* process management
* service management
* package management
* shutdown
* reboot

---

## Filesystem

Examples

* read files
* write files
* move
* copy
* rename
* delete
* search
* compress

---

## Terminal

Examples

* execute commands
* capture output
* stream output
* environment variables

---

## Document

Examples

* parse PDF
* summarize documents
* extract text
* search documents

---

## Search

Examples

* semantic search
* keyword search
* documentation search

---

## Web

Examples

* search engines
* API requests
* webpage retrieval

---

## Automation

Examples

* schedule tasks
* recurring jobs
* reminders
* maintenance

---

## Clipboard

Examples

* read clipboard
* write clipboard

---

## Browser

Examples

* open URLs
* download files
* browser automation (future)

---

## Plugin Tools

Plugins may register additional tools using the standard Tool API.

---

# Tool Interface

Every tool exposes the same interface.

Required fields

```json
{
  "name": "",
  "description": "",
  "permissions": [],
  "parameters": {},
  "returns": {}
}
```

This standardized interface allows tools to be discovered and invoked consistently.

---

# Example Tool Definition

```json
{
  "name": "filesystem.search",
  "description": "Search files matching specified criteria.",
  "permissions": [
    "filesystem.read"
  ],
  "parameters": {
    "directory": "string",
    "pattern": "string"
  }
}
```

---

# Execution Result

Every tool returns structured data.

```json
{
  "success": true,
  "tool": "filesystem.search",
  "execution_time_ms": 184,
  "result": {},
  "error": null
}
```

The LLM receives only this structured output and never interacts directly with the operating system.

---

# Permission Model

Every tool declares the permissions it requires.

Examples

Filesystem

* filesystem.read
* filesystem.write
* filesystem.delete

Linux

* package.install
* package.remove
* service.restart

Network

* network.request
* network.download

Clipboard

* clipboard.read
* clipboard.write

---

# Permission Levels

## Level 1 — Safe

Examples

* read files
* search directories
* check system information

Executed immediately.

---

## Level 2 — Confirmation Required

Examples

* install packages
* modify files
* move directories
* restart services

Require explicit user approval.

---

## Level 3 — Restricted

Examples

* delete system files
* format storage devices
* modify boot configuration
* remove user accounts

Blocked by default unless explicitly authorized.

---

# Validation

Before execution, the Tool Manager validates:

* parameter types
* required arguments
* path safety
* permission requirements
* execution limits
* timeout settings

Invalid requests are rejected before reaching the operating system.

---

# Timeouts

Every tool should define a maximum execution time.

Examples

Filesystem Search

30 seconds

System Information

5 seconds

Package Installation

Unlimited while reporting progress

---

# Logging

Every execution is logged.

Stored information

* timestamp
* tool name
* execution duration
* result status
* requesting conversation
* permission decision

Sensitive outputs should be redacted when appropriate.

---

# Error Handling

Possible failures include:

* permission denied
* invalid arguments
* timeout
* tool unavailable
* operating system error
* dependency missing

The Tool Manager returns structured error information instead of raw exceptions.

---

# Tool Discovery

The Tool Manager maintains a registry of available tools.

Each registered tool includes:

* identifier
* description
* category
* permissions
* version
* provider

This allows dynamic loading of built-in and plugin tools.

---

# Plugin Integration

Plugins may contribute additional tools.

Requirements

* unique identifier
* declared permissions
* version metadata
* compatibility information

Plugins cannot override built-in security policies.

---

# Security Principles

The Tool Calling System enforces the following rules:

1. The LLM never executes operating system commands directly.
2. Every tool invocation passes through the Orchestrator.
3. Every execution requires validation.
4. Permission checks occur before execution.
5. Structured outputs replace raw shell interaction.
6. Every execution is logged.
7. Plugins operate under the same permission model as built-in tools.
8. Dangerous operations always require explicit user approval.

---

# Future Enhancements

The architecture is designed to support additional capabilities, including:

* parallel tool execution
* streaming tool output
* remote Linux host management
* SSH execution
* Docker and Podman management
* Kubernetes integration
* MCP (Model Context Protocol) tools
* cloud service connectors
* sandboxed plugin execution
* distributed workflow execution

---

# Design Principles

* Tools are deterministic components, not AI agents.
* Each tool has a single responsibility.
* Tool interfaces are standardized.
* Security takes precedence over convenience.
* The Orchestrator remains the single coordinator for all tool execution.
* The Tool Manager abstracts the implementation details of every tool.
* Tools should be independently testable and replaceable.

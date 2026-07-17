# API Documentation

## Project

**VOID — Intelligent Linux AI Assistant**

**Version:** 1.0

---

# Overview

The VOID API provides a structured interface between the Desktop Application, AI Backend, Plugins, and future external clients.

The API follows a service-oriented architecture where every request passes through the Request Orchestrator before reaching internal services.

The API is designed to be:

* Consistent
* Versioned
* Secure
* Streamable
* Extensible
* Platform-independent

---

# Architecture

```text id="d1o8mz"
Desktop UI
      │
      ▼
IPC / HTTP API
      │
      ▼
API Gateway
      │
      ▼
Request Orchestrator
      │
      ▼
Internal Services
```

Every request follows the same validation and authorization pipeline.

---

# API Principles

* JSON request and response format
* Stateless endpoints where possible
* Streaming support for long-running tasks
* Structured error responses
* Versioned API
* Authentication-ready architecture
* Consistent response schema

---

# Base Path

```text id="qh6gpl"
/api/v1/
```

Future versions will use:

```text id="wlh11w"
/api/v2/
/api/v3/
```

---

# Standard Response Format

Every successful request returns:

```json id="lupm6g"
{
  "success": true,
  "data": {},
  "message": ""
}
```

---

# Standard Error Format

```json id="gzb0xo"
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description"
  }
}
```

---

# Authentication

Version 1

* Local desktop application
* No user authentication required

Future

* Multiple users
* API tokens
* OAuth
* Session management

---

# Chat API

## Create Conversation

```
POST /chat
```

Creates a new conversation.

---

## Send Message

```
POST /chat/{conversation_id}/messages
```

Request

```json id="c5e03x"
{
  "message": "Explain systemd."
}
```

Response

```json id="v5a8kp"
{
  "success": true,
  "data": {
    "response": "...",
    "conversation_id": "..."
  }
}
```

---

## Conversation History

```
GET /chat/{conversation_id}
```

Returns conversation messages.

---

## List Conversations

```
GET /chat
```

Returns all conversations.

---

## Delete Conversation

```
DELETE /chat/{conversation_id}
```

---

# Tool API

## Execute Tool

```
POST /tools/execute
```

Request

```json id="qzmpaq"
{
  "tool": "filesystem.search",
  "parameters": {}
}
```

Response

```json id="qayemk"
{
  "success": true,
  "data": {}
}
```

---

## List Tools

```
GET /tools
```

Returns registered tools.

---

## Tool Information

```
GET /tools/{tool_name}
```

Returns metadata.

---

# Memory API

## List Memories

```
GET /memory
```

---

## Create Memory

```
POST /memory
```

---

## Update Memory

```
PUT /memory/{memory_id}
```

---

## Delete Memory

```
DELETE /memory/{memory_id}
```

---

## Search Memory

```
POST /memory/search
```

---

# Document API

## Upload Document

```
POST /documents
```

---

## List Documents

```
GET /documents
```

---

## Delete Document

```
DELETE /documents/{document_id}
```

---

## Index Document

```
POST /documents/{document_id}/index
```

---

## Search Documents

```
POST /documents/search
```

---

# RAG API

## Search Knowledge

```
POST /knowledge/search
```

Returns semantic search results.

---

## Reindex

```
POST /knowledge/reindex
```

---

## Index Status

```
GET /knowledge/status
```

---

# Voice API

## Speech Recognition

```
POST /voice/transcribe
```

---

## Text-to-Speech

```
POST /voice/speak
```

---

## Stop Playback

```
POST /voice/stop
```

---

# Automation API

## Create Automation

```
POST /automations
```

---

## List Automations

```
GET /automations
```

---

## Enable Automation

```
POST /automations/{id}/enable
```

---

## Disable Automation

```
POST /automations/{id}/disable
```

---

# Plugin API

## List Plugins

```
GET /plugins
```

---

## Install Plugin

```
POST /plugins/install
```

---

## Remove Plugin

```
DELETE /plugins/{plugin_id}
```

---

## Plugin Information

```
GET /plugins/{plugin_id}
```

---

# Settings API

## Retrieve Settings

```
GET /settings
```

---

## Update Settings

```
PUT /settings
```

---

# System API

## System Information

```
GET /system/info
```

---

## Health Check

```
GET /system/health
```

---

## Logs

```
GET /system/logs
```

---

# Streaming

Long-running operations should support streaming responses.

Examples

* AI generation
* document indexing
* package installation
* file search
* speech recognition

Streaming events may include:

* started
* progress
* partial output
* completed
* failed

---

# Status Codes

| Code | Meaning            |
| ---- | ------------------ |
| 200  | Success            |
| 201  | Resource Created   |
| 204  | No Content         |
| 400  | Invalid Request    |
| 401  | Unauthorized       |
| 403  | Forbidden          |
| 404  | Resource Not Found |
| 409  | Conflict           |
| 422  | Validation Error   |
| 429  | Rate Limited       |
| 500  | Internal Error     |

---

# Versioning

The API uses URL-based versioning.

Example

```text id="azr66t"
/api/v1/chat
```

Breaking changes require a new version.

---

# Security

Every request passes through:

```text id="a2pr7e"
Validation

↓

Permission Manager

↓

Tool Manager

↓

Execution
```

The API never exposes direct operating system access.

---

# Future APIs

The architecture is designed to support future interfaces, including:

* WebSocket API
* MCP Server
* CLI API
* Remote API
* SSH Gateway
* Mobile Companion API
* GraphQL (optional)

---

# Design Principles

1. Every request passes through the Request Orchestrator.
2. APIs return structured JSON responses.
3. Streaming is preferred for long-running operations.
4. Versioning preserves backward compatibility.
5. Validation occurs before execution.
6. Security checks precede every system action.
7. APIs are implementation-agnostic and can be consumed by the desktop UI, plugins, CLI, or future external clients.

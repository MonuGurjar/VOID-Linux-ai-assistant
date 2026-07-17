# Tech Stack

## Project

**VOID — Intelligent Linux AI Assistant**

**Version:** 1.0

---

# Technology Philosophy

VOID is built around the following principles:

* Native performance
* Privacy-first AI
* Modular architecture
* Open-source ecosystem
* Cross-platform potential (Linux first)
* Replaceable components
* Developer-friendly APIs

Whenever possible, technologies should be self-hostable and avoid vendor lock-in.

---

# Desktop Application

## Framework

**Tauri v2**

### Why

* Lightweight
* Native performance
* Low memory usage
* Secure IPC model
* Excellent Rust ecosystem
* Cross-platform support

---

## Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Framer Motion
* Lucide Icons
* Tauri v2
* React Router
* React Hook Form
* Zod

Responsibilities

* Chat UI
* File uploads
* Settings
* Plugin management
* Conversation history
* Notifications

---

# Backend

## Framework

FastAPI

### Why

* High performance
* Async support
* Automatic OpenAPI generation
* Excellent Python ecosystem
* Easy AI integration

Responsibilities

* API
* Orchestration
* Tool execution
* Memory
* RAG
* Voice
* Automation

---

# Programming Languages

## Primary

Python

Used for

* AI
* Backend
* Tool execution
* Automation
* Memory
* RAG

---

## Secondary

TypeScript

Used for

* Desktop UI
* Frontend logic
* IPC communication

---

## System

Rust

Used by

* Tauri
* Native integrations
* Performance-critical modules (future)

---

# AI Layer

## LLM Providers

Supported

* Ollama
* LM Studio
* OpenAI-compatible APIs

Requirements

* Streaming
* Function calling
* Local inference
* Cloud fallback

The architecture should allow users to switch providers without modifying application code.

---

# Embedding Models

Requirements

* Local execution
* High-quality semantic embeddings
* Lightweight enough for consumer hardware
* Replaceable model architecture

Embeddings should be generated independently from the primary LLM.

---

# Vector Database

Qdrant

Responsibilities

* Semantic search
* Document retrieval
* Metadata filtering
* Similarity search

---

# Relational Database

PostgreSQL

Stores

* Users
* Conversations
* Messages
* Settings
* Automations
* Plugin metadata
* Logs
* Memory metadata

---

# ORM

SQLAlchemy

Used for

* Database models
* Migrations
* Queries

Migration Tool

Alembic

---

# Cache

Redis

Used for

* Session cache
* Temporary memory
* Rate limiting
* Background queues
* Short-lived state

Redis should never be the primary database.

---

# Document Processing

Supported formats

* PDF
* DOCX
* TXT
* Markdown
* CSV
* JSON
* Source code

Capabilities

* Parsing
* Metadata extraction
* Text extraction
* Chunk generation

---

# Voice System

Speech-to-Text

* Faster Whisper

Text-to-Speech

* Piper

Future

* Wake word engine
* Voice Activity Detection
* Streaming speech

---

# Search

Supported

* Local filesystem
* Indexed documents
* Web search
* Command history
* Conversation history

---

# Background Tasks

APScheduler

Responsibilities

* Scheduled jobs
* Recurring automation
* Maintenance tasks

---

# Logging

Python Logging

Features

* Structured logs
* File logs
* Console logs
* Error tracking

Future

* Log viewer
* Crash reporting
* Performance metrics

---

# Security

Password hashing

Argon2

Encryption

AES-256 (for sensitive local data)

Transport

HTTPS / Secure Local IPC

Secrets

Operating system keyring when available

---

# Testing

Backend

* Pytest

Frontend

* Vitest
* React Testing Library

End-to-End

* Playwright

---

# Code Quality

Python

* Ruff
* Black
* mypy

TypeScript

* ESLint
* Prettier

Git

* pre-commit hooks

---

# Package Management

Python

* uv

Frontend

* pnpm

Rust

* Cargo

---

# Build System

Frontend

Vite

Desktop

Tauri CLI

Backend

uv + FastAPI

---

# Version Control

Git

Repository Hosting

GitHub

Branch Strategy

* main
* develop
* feature/*
* fix/*
* release/*

---

# Deployment

Primary Target

Linux Desktop

Future Targets

* Windows
* macOS

Backend Distribution

Bundled with desktop application

Future

* Optional standalone server mode
* Docker deployment
* Headless mode

---

# Recommended Directory Structure

```text
void/

├── apps/
│   ├── desktop/
│   └── backend/
│
├── packages/
│   ├── sdk/
│   ├── shared/
│   └── ui/
│
├── docs/
│
├── scripts/
│
├── tests/
│
└── assets/
```

---

# Technology Selection Principles

A technology may be replaced if it provides:

* Better performance
* Improved security
* Lower resource consumption
* Greater maintainability
* Stronger community support
* Better developer experience

All major dependencies should remain modular and avoid introducing unnecessary vendor lock-in.

---

# Future Technologies

Potential additions include:

* GPU acceleration for local inference
* ONNX Runtime
* CUDA support
* ROCm support
* Local image generation models
* Vision-language models
* Multi-agent orchestration frameworks
* Remote execution over SSH
* Kubernetes integration
* MCP (Model Context Protocol) server and client support

These technologies are not required for the initial release but align with the long-term architectural vision of VOID.

# Architecture Decision Records (ADRs)

## Project

**VOID — Intelligent Linux AI Assistant**

**Version:** 1.0

---

# Overview

Architecture Decision Records (ADRs) document the significant technical decisions made during the development of VOID.

Each ADR explains:

* The problem being solved
* The available alternatives
* The chosen solution
* The reasoning behind the decision
* The expected consequences

ADRs provide historical context, improve collaboration, and ensure future contributors understand why architectural choices were made.

---

# Goals

The ADR process aims to:

* Record important engineering decisions
* Preserve architectural reasoning
* Reduce repeated discussions
* Improve maintainability
* Support future refactoring
* Onboard new contributors efficiently

---

# When to Create an ADR

An ADR should be created whenever a decision has long-term architectural impact.

Examples include:

* Selecting a database
* Choosing a frontend framework
* Defining the plugin architecture
* Introducing a new communication protocol
* Replacing a core dependency
* Changing the security model
* Adopting a new storage engine

Minor implementation details do not require ADRs.

---

# ADR Structure

Every ADR follows the same template.

```text id="xw4u8m"
Title

Status

Date

Context

Decision

Alternatives Considered

Consequences

Future Considerations
```

---

# Status Values

Each ADR should include one of the following statuses:

* Proposed
* Accepted
* Superseded
* Deprecated

---

# Directory Structure

```text id="b5lzjg"
docs/
└── adr/
    ├── 000-template.md
    ├── 001-tauri.md
    ├── 002-fastapi.md
    ├── 003-postgresql.md
    ├── 004-qdrant.md
    ├── 005-tool-manager.md
    ├── 006-orchestrator.md
    ├── 007-plugin-system.md
    ├── 008-security-model.md
    ├── 009-memory-architecture.md
    └── README.md
```

---

# Recommended ADRs

## ADR-001

**Use Tauri for the Desktop Application**

Decision

Adopt Tauri as the desktop framework instead of Electron.

Reason

* Lower memory usage
* Native performance
* Secure IPC
* Smaller application size

Alternatives

* Electron
* Qt
* GTK

---

## ADR-002

**Use FastAPI for Backend Services**

Decision

Implement backend services using FastAPI.

Reason

* Excellent Python ecosystem
* Async support
* Automatic API documentation
* Strong AI integration

Alternatives

* Flask
* Django
* Quart

---

## ADR-003

**Use PostgreSQL as the Primary Database**

Decision

Store structured application data in PostgreSQL.

Reason

* Mature relational database
* ACID compliance
* Strong JSON support
* Excellent tooling

Alternatives

* SQLite
* MariaDB
* MongoDB

---

## ADR-004

**Use Qdrant for Vector Search**

Decision

Store embeddings in Qdrant.

Reason

* Efficient semantic search
* Metadata filtering
* Open source
* Replaceable architecture

Alternatives

* Chroma
* Milvus
* Weaviate

---

## ADR-005

**Adopt an Orchestrator-Centered Architecture**

Decision

Centralize request handling through a Request Orchestrator.

Reason

* Single coordination point
* Better modularity
* Easier testing
* Consistent execution flow

Alternatives

* Direct service communication
* Monolithic controller

---

## ADR-006

**Separate AI Reasoning from Tool Execution**

Decision

AI generates intent and plans; deterministic components execute system actions.

Reason

* Improved security
* Better reliability
* Easier debugging
* Predictable behavior

Alternatives

* Direct LLM command execution

---

## ADR-007

**Use a Permission-Based Tool System**

Decision

Every tool declares required permissions.

Reason

* User transparency
* Principle of least privilege
* Consistent security model

Alternatives

* Global permissions
* Implicit trust

---

## ADR-008

**Store Uploaded Files on the Filesystem**

Decision

Keep binary files on disk while storing metadata in PostgreSQL.

Reason

* Reduced database size
* Simpler backups
* Better I/O performance

Alternatives

* Store binaries in PostgreSQL
* Object storage

---

## ADR-009

**Adopt Local-First AI**

Decision

Prefer local AI models whenever possible.

Reason

* Privacy
* Offline functionality
* Reduced external dependencies

Alternatives

* Cloud-only inference
* Hybrid-first approach

---

## ADR-010

**Use Modular Services**

Decision

Organize the application into independent services.

Reason

* Replaceable components
* Easier maintenance
* Improved scalability

Alternatives

* Monolithic architecture

---

# ADR Lifecycle

```text id="1l2a6r"
Problem Identified
        │
        ▼
Discussion
        │
        ▼
Architecture Decision
        │
        ▼
ADR Created
        │
        ▼
Review
        │
        ▼
Accepted
        │
        ▼
Implementation
```

---

# Updating ADRs

Architecture evolves over time.

When a previous decision is replaced:

1. Do not modify the historical ADR.
2. Create a new ADR describing the updated decision.
3. Mark the previous ADR as **Superseded**.
4. Reference the new ADR from the old one.

This preserves the architectural history of the project.

---

# Benefits

Maintaining ADRs provides:

* Historical context
* Consistent decision-making
* Easier onboarding
* Improved documentation
* Reduced architectural drift
* Better long-term maintainability

---

# Design Principles

1. Every major architectural decision is documented.
2. ADRs explain **why**, not just **what**.
3. Decisions are immutable once accepted.
4. New decisions supersede old ones rather than rewriting history.
5. ADRs should remain concise, focused, and easy to review.
6. Architectural knowledge is treated as part of the codebase.

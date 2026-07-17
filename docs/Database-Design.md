# Database Design

## Project

**VOID — Intelligent Linux AI Assistant**

**Version:** 1.0

---

# Overview

VOID stores different types of information based on their purpose.

| Storage    | Purpose                              |
| ---------- | ------------------------------------ |
| PostgreSQL | Structured application data          |
| Qdrant     | Embeddings and semantic search       |
| Filesystem | Uploaded files, logs, caches, models |

This separation improves maintainability, scalability, and performance while allowing each storage system to specialize in its workload.

---

# PostgreSQL Database

The relational database stores all structured application data.

---

# Entity Relationship Overview

```text
Users
 │
 ├── Conversations
 │      │
 │      └── Messages
 │
 ├── Memories
 │
 ├── Automations
 │
 ├── Plugins
 │
 ├── Settings
 │
 ├── Documents
 │      │
 │      └── Document Chunks (metadata only)
 │
 ├── Tasks
 │
 ├── Tool Executions
 │
 └── Audit Logs
```

---

# Tables

## users

Stores user accounts.

| Column       | Type      |
| ------------ | --------- |
| id           | UUID      |
| username     | TEXT      |
| display_name | TEXT      |
| email        | TEXT      |
| created_at   | TIMESTAMP |
| updated_at   | TIMESTAMP |

---

## conversations

Stores chat sessions.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | TEXT      |
| summary    | TEXT      |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Relationship

```
User

↓

Many Conversations
```

---

## messages

Stores conversation messages.

| Column          | Type      |
| --------------- | --------- |
| id              | UUID      |
| conversation_id | UUID      |
| role            | TEXT      |
| content         | TEXT      |
| token_count     | INTEGER   |
| created_at      | TIMESTAMP |

Roles

* user
* assistant
* system
* tool

---

## memories

Stores long-term memory.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | TEXT      |
| content    | TEXT      |
| category   | TEXT      |
| importance | INTEGER   |
| created_at | TIMESTAMP |

Categories

* preference
* note
* workflow
* reminder
* alias
* fact

---

## documents

Tracks uploaded files.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| filename   | TEXT      |
| file_type  | TEXT      |
| file_size  | BIGINT    |
| file_path  | TEXT      |
| checksum   | TEXT      |
| indexed    | BOOLEAN   |
| created_at | TIMESTAMP |

The actual files are stored on the filesystem.

---

## document_chunks

Stores metadata for indexed document chunks.

| Column      | Type      |
| ----------- | --------- |
| id          | UUID      |
| document_id | UUID      |
| chunk_index | INTEGER   |
| vector_id   | TEXT      |
| page_number | INTEGER   |
| created_at  | TIMESTAMP |

Chunk text and embeddings are stored in Qdrant.

---

## tool_executions

Records every tool execution.

| Column            | Type      |
| ----------------- | --------- |
| id                | UUID      |
| conversation_id   | UUID      |
| tool_name         | TEXT      |
| status            | TEXT      |
| execution_time_ms | INTEGER   |
| created_at        | TIMESTAMP |

Status

* pending
* running
* completed
* failed

---

## tasks

Stores planned tasks.

| Column          | Type      |
| --------------- | --------- |
| id              | UUID      |
| conversation_id | UUID      |
| description     | TEXT      |
| status          | TEXT      |
| priority        | INTEGER   |
| created_at      | TIMESTAMP |

---

## automations

Stores scheduled workflows.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| name       | TEXT      |
| schedule   | TEXT      |
| enabled    | BOOLEAN   |
| created_at | TIMESTAMP |

---

## plugins

Stores installed plugin metadata.

| Column       | Type      |
| ------------ | --------- |
| id           | UUID      |
| name         | TEXT      |
| version      | TEXT      |
| enabled      | BOOLEAN   |
| permissions  | JSONB     |
| installed_at | TIMESTAMP |

---

## settings

Stores user preferences.

| Column  | Type  |
| ------- | ----- |
| id      | UUID  |
| user_id | UUID  |
| key     | TEXT  |
| value   | JSONB |

Examples

* theme
* preferred_model
* voice
* language
* temperature
* privacy

---

## audit_logs

Stores security events.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| event      | TEXT      |
| severity   | TEXT      |
| created_at | TIMESTAMP |

Examples

* plugin installed
* file deleted
* permission denied
* command executed

---

# Qdrant Design

Qdrant stores embeddings only.

Collections

## documents

Stores indexed documents.

Metadata

* document_id
* filename
* page
* chunk
* tags

---

## memories

Stores semantic memories.

Metadata

* memory_id
* category
* importance

---

## repositories

Stores indexed source code.

Metadata

* repository
* language
* path
* symbol

---

## notes

Stores personal notes.

Metadata

* notebook
* tags

---

# Filesystem Layout

The filesystem stores large binary assets.

```text
~/.local/share/void/

├── uploads/
│
├── documents/
│
├── models/
│
├── logs/
│
├── cache/
│
├── temp/
│
└── exports/
```

---

# Relationships

```text
User
 │
 ├── Conversations
 │      │
 │      ├── Messages
 │      ├── Tasks
 │      └── Tool Executions
 │
 ├── Memories
 │
 ├── Documents
 │      │
 │      └── Document Chunks
 │
 ├── Automations
 │
 ├── Settings
 │
 └── Plugins
```

---

# Data Lifecycle

## Chat

User Message

↓

Conversation

↓

Messages

↓

Memory (optional)

↓

Archived

---

## Documents

Upload

↓

Filesystem

↓

Metadata → PostgreSQL

↓

Chunking

↓

Embeddings

↓

Qdrant

---

## Memory

User Approval

↓

PostgreSQL

↓

Embedding

↓

Qdrant

---

# Retention Policy

* Conversations are retained until deleted by the user.
* Files remain on disk until removed.
* Embeddings are deleted when their source content is removed.
* Audit logs may be rotated based on user-defined retention settings.
* Temporary cache is periodically cleaned.

---

# Design Principles

1. PostgreSQL stores structured application data.
2. Qdrant stores embeddings only.
3. Large files remain on the filesystem.
4. No duplicated data across storage layers unless required.
5. Every record uses a UUID primary key.
6. Foreign key relationships maintain referential integrity.
7. Embeddings are regenerated only when source content changes.

---

# Future Extensions

The schema is designed to support future capabilities without major changes, including:

* Multiple user profiles
* Shared workspaces
* Remote Linux hosts
* Cloud synchronization
* Plugin marketplace
* Team collaboration
* Cross-device memory
* AI usage analytics

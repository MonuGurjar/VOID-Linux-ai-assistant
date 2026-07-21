<h1 align="center">🌌 VOID — Intelligent Linux AI Assistant</h1>

<p align="center">
  <strong>Privacy-first · Local-first · Offline-capable</strong><br/>
  A desktop AI assistant that makes Linux interaction as natural as conversation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blueviolet?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/platform-Linux-8A2BE2?style=flat-square&logo=linux&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/license-GPLv3-purple?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/status-Active%20Development-violet?style=flat-square" alt="Status" />
</p>


---

## 🌌 Vision

> *Build a trustworthy AI assistant that helps Linux users learn, automate, and operate their systems confidently while maintaining complete control over their data.*

VOID safely translates natural language into system actions — it **teaches Linux** rather than hiding it, and never takes autonomous action without your approval.

### Core Principles

| Principle | Description |
|---|---|
| 🔒 **Privacy First** | All AI models run locally. No data leaves your machine. Zero telemetry. |
| 🔍 **Transparency** | Every action is explainable — see exactly what VOID plans to do before it does it. |
| 🛡️ **Safety** | Destructive operations always require explicit user confirmation. |
| 📚 **Learning Over Replacing** | VOID teaches you Linux commands rather than abstracting them away. |
| 🧩 **Extensibility** | Plugin-based architecture — extend VOID to fit your workflow. |

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 💬 Conversational AI
- Natural language chat with local LLMs
- Streaming responses with Markdown rendering
- Syntax-highlighted code blocks with copy support
- Conversation history with search, rename & delete

### 🧠 Local AI Engine
- **Ollama** & **LM Studio** integration
- Hot-swap between providers & models
- OpenAI-compatible API support
- Fully offline — no cloud dependency

### 🖥️ System Integration
- Execute Linux commands via natural language
- File operations & system control
- Real-time system monitoring (CPU, RAM, GPU)

</td>
<td width="50%">

### 📄 Document Understanding
- PDF, DOCX, TXT, Markdown, CSV, JSON
- Code file analysis
- RAG-powered knowledge base (coming soon)

### 🎙️ Voice Assistant *(Planned)*
- Speech-to-Text via Faster Whisper
- Text-to-Speech via Piper
- Hands-free interaction

### 🔌 Plugin System *(Planned)*
- Extensible tool & plugin SDK
- Community marketplace
- Custom automation workflows

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                     │
│  ┌──────────┐  ┌───────────────────┐  ┌──────────────┐  │
│  │   Left   │  │    Chat Canvas    │  │    Right     │  │
│  │ Sidebar  │  │  + Model Selector │  │   Sidebar    │  │
│  │ (History)│  │  + Welcome Grid   │  │  (Monitor)   │  │
│  └──────────┘  └───────────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ IPC / HTTP
              ┌──────────▼──────────┐
              │   FastAPI Backend   │
              │  ┌────────────────┐ │
              │  │  Orchestrator  │ │
              │  ├────────────────┤ │
              │  │  LLM Provider  │──── Ollama / LM Studio
              │  ├────────────────┤ │
              │  │  Tool Manager  │──── Linux System Tools
              │  ├────────────────┤ │
              │  │   SQLite DB    │ │
              │  └────────────────┘ │
              └─────────────────────┘
```

> **Security Model:** UI never talks to the OS directly. LLM never executes system actions directly. All actions are routed through the Tool Manager with permission checks and user approval for destructive operations.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Desktop Shell** | Tauri v2 (Rust) |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| **UI Components** | shadcn/ui, Lucide Icons, Framer Motion |
| **Backend** | FastAPI (Python 3.13+), Uvicorn |
| **Database** | SQLite (SQLModel ORM) |
| **Vector DB** | Qdrant *(planned)* |
| **AI Providers** | Ollama, LM Studio, OpenAI-compatible APIs |
| **Voice** | Faster Whisper (STT), Piper (TTS) *(planned)* |
| **Package Managers** | pnpm (frontend), uv (Python), Cargo (Rust) |
| **Code Quality** | ESLint, Prettier, Ruff, Black, mypy |
| **Testing** | Pytest, Vitest, React Testing Library |

---

## 🚀 Getting Started

### Prerequisites

- **Linux** (any modern distro)
- **Node.js** ≥ 20 & **pnpm**
- **Python** ≥ 3.13 & **uv**
- **Rust** (for Tauri — optional for dev server)
- **Ollama** or **LM Studio** (for local AI)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MonuGurjar/VOID-Linux-ai-assistant.git
cd VOID-Linux-ai-assistant

# 2. Install frontend dependencies
pnpm install

# 3. Start the backend
cd apps/backend
uv sync
uv run uvicorn main:app --reload --port 8000

# 4. Start the frontend (in a new terminal)
cd apps/desktop
pnpm dev
```

### Start Ollama (if using Ollama)

```bash
# Pull a model
ollama pull llama3.2

# Ollama serves on http://localhost:11434 by default
```

Open the app at `http://localhost:5173` — select your provider and model from the top-right selector, and start chatting!

---

## 📁 Project Structure

```
VOID-ai-assistant/
├── apps/
│   ├── backend/          # FastAPI Python backend
│   │   ├── src/          # Source modules
│   │   ├── main.py       # Entry point
│   │   └── pyproject.toml
│   └── desktop/          # Tauri + React frontend
│       ├── src/
│       │   ├── components/  # UI components (Sidebar, Layout, etc.)
│       │   ├── hooks/       # Custom React hooks
│       │   ├── pages/       # Route pages (ChatPage, Settings)
│       │   └── App.tsx      # Root app component
│       └── package.json
├── packages/             # Shared packages (monorepo)
├── docs/                 # Architecture, PRD, Security, API docs
├── development/          # Phase-by-phase implementation plan
└── pnpm-workspace.yaml   # Monorepo workspace config
```

---

## 🗺️ Roadmap

| Phase | Status | Description |
|---|---|---|
| Phase 0 — Foundation | ✅ Done | Project scaffold, monorepo, backend + frontend setup |
| Phase 1 — Core UI | ✅ Done | Chat interface, sidebar, conversations, streaming |
| Phase 2 — Local AI | 🔄 In Progress | Ollama/LM Studio integration, model management |
| Phase 3 — Knowledge Engine | ⬜ Planned | RAG pipeline, document ingestion, Qdrant |
| Phase 4 — Memory | ⬜ Planned | Persistent memory, context across sessions |
| Phase 5 — Voice | ⬜ Planned | STT (Faster Whisper) + TTS (Piper) |
| Phase 6 — Project Intelligence | ⬜ Planned | Codebase-aware assistance |
| Phase 7 — Automation | ⬜ Planned | Scheduled tasks, workflows |
| Phase 8 — Plugin Platform | ⬜ Planned | Plugin SDK, community marketplace |
| Phase 9 — Advanced Linux | ⬜ Planned | Containers, SSH, VMs |
| Phase 10 — Multimodal | ⬜ Planned | Image, OCR, screenshot analysis |
| Phase 11 — Personal Workspace | ⬜ Planned | Dashboard, widgets, custom workflows |
| Phase 12 — Polish | ⬜ Planned | Performance, accessibility, final QA |

---

## 🚫 Explicitly Out of Scope (v1)

- Cloud-only operation or SaaS model
- User accounts, OAuth, or multi-user support
- Telemetry, analytics, or data collection
- Autonomous system modifications without approval
- Windows/macOS support (Linux-only for v1)
- Enterprise or commercial features

---

## 📖 Documentation

Detailed documentation lives in the [`docs/`](docs/) folder:

| Document | Description |
|---|---|
| [Vision](docs/Vision.md) | Project vision & core principles |
| [PRD](docs/PRD.md) | Product Requirements Document |
| [System Architecture](docs/System-Architecture.md) | Component design & data flow |
| [Tech Stack](docs/Tech-stack.md) | Technology choices & rationale |
| [API Documentation](docs/API-Documentation.md) | Backend REST API reference |
| [Database Design](docs/Database-Design.md) | Schema & data models |
| [AI Pipeline](docs/AI-Pipeline.md) | LLM integration & inference pipeline |
| [RAG Documentation](docs/RAG-Documentation.md) | Retrieval-Augmented Generation design |
| [Agent System](docs/Agent-System.md) | AI agent architecture |
| [Tool Calling](docs/Tool-Calling.md) | System tool execution framework |
| [Voice System](docs/Voice-System.md) | STT/TTS pipeline design |
| [Security](docs/Security.md) | Security model & threat mitigation |
| [Testing](docs/Testing.md) | Testing strategy & guidelines |
| [Roadmap](docs/Roadmap.md) | Full development roadmap |

---

## 🤝 Contributing

Contributions are welcome! VOID follows these development principles:

1. **Local-first by default** — features must work offline
2. **AI assists, never controls** — user always has final say
3. **Security before convenience** — never cut corners on safety
4. **Privacy before features** — never add telemetry or tracking
5. **Quality before quantity** — every phase must compile, pass tests, and have updated docs

```bash
# Run frontend type checks
cd apps/desktop && npx tsc --noEmit

# Run backend linting
cd apps/backend && uv run ruff check .
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with 💜 for the Linux community</sub><br/>
  <sub><strong>VOID</strong> — Your private, intelligent Linux companion</sub>
</p>

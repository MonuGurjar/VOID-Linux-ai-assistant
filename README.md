# ENMA - Evolving Neural Monitoring Agent

ENMA is a local, OS-level automation agent powered by an offline Large Language Model (LLM) and built with PyQt6. It acts as an intelligent assistant capable of executing system-level operations, searching the internet, finding local files, and monitoring hardware health—all from a sleek, premium dark-mode interface.

## Features

- **Local LLM Orchestration**: Fully offline and private brain powered by [Ollama](https://ollama.com/), utilizing structured tool-calling.
- **Autonomous Tool Execution**: Safely performs operations like creating directory backups and managing files via native Python tools.
- **Guardrail Authorization Sandbox**: Sensitive actions (like executing raw shell commands) are halted and pushed to an interactive UI queue for your explicit approval before execution.
- **File Database Indexing**: Instantly locates files on your system. It builds a local SQLite database of your home directory (including visible files and essential configs) for instant path resolution.
- **Direct Internet Search**: Integrated with DuckDuckGo (`ddgs`) to allow the agent to surf the web for real-time information or let you run direct queries from the UI.
- **Secure Privileges**: Uses `pkexec` for system logs (like `journalctl`), triggering native graphical authentication without exposing plain text passwords to the LLM.
- **Real-Time Hardware Metrics**: Live PyQt6 progress bars displaying CPU, RAM, and Disk usage asynchronously.

## Architecture

The codebase is highly decoupled and modular:

```
enma-agent/
├── app.py             # Main PyQt6 entry point (UI, Metrics Loop, Approval Queue)
├── config.py          # System constants, LLM model settings, banned command regex
├── core/
│   ├── llm_client.py  # Synchronous Ollama client parsing tool schema
│   └── worker.py      # QThread background worker ensuring a responsive UI
├── security/
│   └── guardrails.py  # Regex safety layer catching bad shell commands
└── tools/
    └── system_ops.py  # Executable Python functions (DDGS search, SQLite DB, pkexec)
```

## Prerequisites

- **Garuda Linux** (or any modern Linux distribution)
- **Python 3.11+**
- **uv** (The extremely fast Python package manager)
- **Ollama** running locally with your chosen model installed (default is aliased as `ENMA` or you can change `DEFAULT_MODEL` in `config.py` to `llama3` or `qwen2.5-coder:7b`).

## Installation

### Quick Install (Recommended)
You can install and setup the ENMA Agent automatically with a single command. The script will clone the repo and let you choose your preferred Python environment manager (`uv`, `mise`, `pyenv`, or standard `python3 venv`):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/MonuGurjar/ENMA-Linux-ai-assistant/main/install.sh)"
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MonuGurjar/ENMA-Linux-ai-assistant.git
   cd ENMA-Linux-ai-assistant
   ```

2. Sync the dependencies and virtual environment using `uv`:
   ```bash
   uv sync
   # Or manually:
   # python3 -m venv .venv && source .venv/bin/activate
   # pip install -r requirements.txt
   ```

3. Ensure Ollama is running and your model is pulled:
   ```bash
   ollama serve
   ```

## Usage

Start the GUI application:

```bash
uv run python app.py
```

### Example Prompts:
- *"What is my current system load?"*
- *"Index my home directory files so you can find them later."*
- *"Search the internet for the latest updates on the Linux kernel."*
- *"Show me the NetworkManager system logs."* (Triggers a secure Polkit popup)
- *"Run a bash command to delete my root directory."* (Tests the guardrails and blocks it)

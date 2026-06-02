import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
FILE_DB_PATH = DATA_DIR / "file_index.db"

# Ollama Config
DEFAULT_MODEL = "ENMA"
OLLAMA_URL = "http://localhost:11434"

# Security Configuration
# Commands that the LLM is explicitly forbidden to execute (regex patterns or strings)
BANNED_COMMANDS = [
    r"\brm\s+-rf\s+/",
    r"\bmkfs\b",
    r"\bdd\s+if=.*of=/dev/",
    r"\bchmod\s+-R\s+777\s+/",
    r"\bchown\s+-R\s+.*:.*\s+/",
    r"\bmv\s+.*\s+/dev/null",
    r"\bwget\s+.*\s+\|\s+sh",
    r"\bcurl\s+.*\s+\|\s+bash"
]

# Sensitive Actions that require explicit user approval (sandbox mode)
SENSITIVE_ACTIONS = [
    "execute_shell_command"
]

import json
import logging
from typing import List, Dict, Any, Optional
from ollama import Client
from config import OLLAMA_URL, DEFAULT_MODEL

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ENMA (Evolving Neural Monitoring Agent), a local OS-level automation agent on Garuda Linux.
You have access to a set of tools to interact with the system.
When a user asks you to perform a task, you must use the appropriate tools.
Always try to be helpful and autonomous. 
If asked to copy a file by name, first use 'search_file_index' to find its absolute path, then use 'copy_file' or 'execute_shell_command' to complete the job.
If a command is blocked for security, inform the user why.
"""

# Define the tools schema for Ollama
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_system_health_metrics",
            "description": "Returns a dictionary containing current system health metrics (CPU, RAM, Disk).",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_file_index",
            "description": "Indexes the home directory for fast file retrieval. Use this when the user asks to refresh or build the file index.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_file_index",
            "description": "Searches the file index for a given filename and returns matching absolute paths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The filename or partial filename to search for."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_directory_backup",
            "description": "Creates a zip archive backup of a directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "source_dir": {
                        "type": "string",
                        "description": "The absolute path to the directory to backup."
                    },
                    "dest_zip": {
                        "type": "string",
                        "description": "The absolute path for the destination zip file."
                    }
                },
                "required": ["source_dir", "dest_zip"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "copy_file",
            "description": "Copies a file from source to dest.",
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "The absolute path to the source file."
                    },
                    "dest": {
                        "type": "string",
                        "description": "The absolute path to the destination directory or file."
                    }
                },
                "required": ["source", "dest"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_logs",
            "description": "Fetches system logs using journalctl via pkexec.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service": {
                        "type": "string",
                        "description": "Optional service name to filter logs by (e.g., 'NetworkManager')."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_shell_command",
            "description": "Executes a general shell command.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The bash shell command to execute."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Searches the internet using DuckDuckGo and returns the results. Use this when the user asks for online information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

class LLMClient:
    def __init__(self):
        self.client = Client(host=OLLAMA_URL)
        self.messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    def chat(self, user_input: str) -> Dict[str, Any]:
        """
        Sends a message to the LLM and returns the response, which may include tool calls.
        """
        self.messages.append({"role": "user", "content": user_input})
        
        try:
            response = self.client.chat(
                model=DEFAULT_MODEL,
                messages=self.messages,
                tools=TOOLS_SCHEMA
            )
            
            message = response.get('message', {})
            self.messages.append(message)
            return message
            
        except Exception as e:
            logger.error(f"Error communicating with Ollama: {e}")
            return {"role": "assistant", "content": f"Error: {str(e)}"}
            
    def provide_tool_result(self, tool_name: str, result: str) -> Dict[str, Any]:
        """
        Provides the result of a tool call back to the LLM.
        """
        self.messages.append({"role": "tool", "content": str(result), "name": tool_name})
        
        try:
            response = self.client.chat(
                model=DEFAULT_MODEL,
                messages=self.messages,
                tools=TOOLS_SCHEMA
            )
            
            message = response.get('message', {})
            self.messages.append(message)
            return message
            
        except Exception as e:
            logger.error(f"Error communicating with Ollama: {e}")
            return {"role": "assistant", "content": f"Error: {str(e)}"}

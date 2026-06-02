import re
from typing import Tuple
from config import BANNED_COMMANDS, SENSITIVE_ACTIONS

def check_command_safety(command: str) -> Tuple[bool, str]:
    """
    Checks a raw shell command against banned regex patterns.
    Returns (is_safe, reason)
    """
    if not command:
        return False, "Empty command"
        
    for pattern in BANNED_COMMANDS:
        if re.search(pattern, command, re.IGNORECASE):
            return False, f"Command matches banned pattern: {pattern}"
            
    return True, "Command is safe"

def requires_approval(tool_name: str) -> bool:
    """
    Checks if a requested tool requires human approval before execution.
    """
    return tool_name in SENSITIVE_ACTIONS

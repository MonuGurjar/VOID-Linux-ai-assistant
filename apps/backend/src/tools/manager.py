import logging
from typing import Dict, Any
from .registry import registry

logger = logging.getLogger(__name__)

class ToolManager:
    """Manages tool execution lifecycle and security policy enforcement."""

    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        tool = registry.get_tool(tool_name)
        if not tool:
            return {"error": f"Tool '{tool_name}' is not registered.", "success": False}

        try:
            logger.info(f"Executing tool '{tool_name}' with args: {arguments}")
            result = await tool.execute(**arguments)
            return result
        except Exception as e:
            logger.error(f"Error executing tool '{tool_name}': {e}")
            return {"error": str(e), "success": False}

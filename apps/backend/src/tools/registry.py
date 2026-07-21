from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class Tool(ABC):
    """Abstract base class for all VOID Linux tools."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique tool identifier."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the tool accomplishes."""
        pass

    @property
    @abstractmethod
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON Schema format for tool input parameters."""
        pass

    @property
    def requires_approval(self) -> bool:
        """Whether this tool requires explicit user permission before execution."""
        return True

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute tool action and return JSON result dictionary."""
        pass

    def to_openai_tool(self) -> Dict[str, Any]:
        """Convert tool definition to OpenAI/Ollama function calling schema."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema
            }
        }


class ToolRegistry:
    """Registry singleton managing all active tools."""

    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        if tool.name not in self._tools:
            logger.info(f"Registered tool: {tool.name}")
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Tool]:
        return list(self._tools.values())

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_openai_tool() for tool in self._tools.values()]


# Global tool registry instance
registry = ToolRegistry()

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from ..tools.registry import registry
from ..tools.builtin import register_builtin_tools
from ..tools.manager import ToolManager

router = APIRouter(prefix="/tools", tags=["tools"])

# Ensure built-in tools are registered
register_builtin_tools()

class ExecuteToolRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

@router.get("/")
def list_tools():
    """List all active tools registered in the VOID Tool System."""
    tools = registry.list_tools()
    return [
        {
            "name": t.name,
            "description": t.description,
            "parameters": t.parameters_schema,
            "requires_approval": t.requires_approval
        }
        for t in tools
    ]

@router.post("/execute")
async def execute_tool(req: ExecuteToolRequest):
    """Execute a specific tool by name with arguments."""
    result = await ToolManager.execute_tool(req.tool_name, req.arguments)
    return result

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from openai import AsyncOpenAI
import httpx
from typing import Optional
from ..db import get_session
from ..models.settings import Setting

router = APIRouter(prefix="/ai", tags=["ai"])

DEFAULT_PROVIDER_URLS = {
    "ollama": "http://localhost:11434/v1",
    "lmstudio": "http://localhost:1234/v1",
    "vllm": "http://localhost:8080/v1",
}

@router.get("/models")
async def get_models(
    provider: Optional[str] = Query("ollama"),
    custom_url: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    if provider == "custom" and custom_url:
        base_url = custom_url.rstrip("/") + "/v1" if not custom_url.endswith("/v1") else custom_url
    elif provider in DEFAULT_PROVIDER_URLS:
        base_url = DEFAULT_PROVIDER_URLS[provider]
    else:
        setting = session.get(Setting, "ai_base_url")
        base_url = setting.value if setting else "http://localhost:11434/v1"
    
    client = AsyncOpenAI(
        base_url=base_url,
        api_key="local-ai",
        timeout=3.0
    )
    
    try:
        response = await client.models.list()
        return [{"id": m.id, "name": m.id} for m in response.data]
    except Exception as e:
        return []

@router.get("/health")
async def check_services_health():
    """Pings local provider endpoints cleanly and returns status."""
    async with httpx.AsyncClient(timeout=1.5) as http_client:
        results = {
            "backend": "running",
            "sqlite": "running",
            "ollama": "stopped",
            "lmstudio": "stopped",
            "vllm": "stopped",
        }
        
        # Check Ollama
        try:
            res = await http_client.get("http://localhost:11434/api/tags")
            if res.status_code == 200:
                results["ollama"] = "running"
        except Exception:
            pass

        # Check LM Studio
        try:
            res = await http_client.get("http://localhost:1234/v1/models")
            if res.status_code == 200:
                results["lmstudio"] = "running"
        except Exception:
            pass

        # Check vLLM
        try:
            res = await http_client.get("http://localhost:8080/v1/models")
            if res.status_code == 200:
                results["vllm"] = "running"
        except Exception:
            pass
            
        return results

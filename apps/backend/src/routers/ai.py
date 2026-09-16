from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from openai import AsyncOpenAI
import os
import httpx
from typing import Optional
from ..db import get_session
from ..models.settings import Setting

router = APIRouter(prefix="/ai", tags=["ai"])

DEFAULT_PROVIDER_URLS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "lmstudio": "http://localhost:1234/v1",
    "vllm": "http://localhost:8080/v1",
}

GEMINI_MODELS = [
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash (Recommended)"},
    {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash"},
]

@router.get("/models")
async def get_models(
    provider: Optional[str] = Query("gemini"),
    custom_url: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    models = []
    
    if provider == "gemini" or not provider:
        return GEMINI_MODELS

    if provider == "custom" and custom_url:
        base_url = custom_url.rstrip("/") + "/v1" if not custom_url.endswith("/v1") else custom_url
    elif provider in DEFAULT_PROVIDER_URLS:
        base_url = DEFAULT_PROVIDER_URLS[provider]
    else:
        setting = session.get(Setting, "ai_base_url")
        base_url = setting.value if setting else "http://localhost:1234/v1"
    
    # Method 1: AsyncOpenAI client for LM Studio / vLLM / Custom
    try:
        client = AsyncOpenAI(
            base_url=base_url,
            api_key="local-ai",
            timeout=3.0
        )
        response = await client.models.list()
        for m in response.data:
            models.append({"id": m.id, "name": m.id})
    except Exception:
        pass

    # Method 2: Fallback direct HTTP requests
    if not models:
        async with httpx.AsyncClient(timeout=3.0) as http_client:
            if provider == "lmstudio":
                try:
                    res = await http_client.get("http://localhost:1234/v1/models")
                    if res.status_code == 200:
                        data = res.json()
                        for m in data.get("data", []):
                            m_id = m.get("id")
                            if m_id:
                                models.append({"id": m_id, "name": m_id})
                except Exception:
                    pass
            elif provider == "vllm":
                try:
                    res = await http_client.get("http://localhost:8080/v1/models")
                    if res.status_code == 200:
                        data = res.json()
                        for m in data.get("data", []):
                            m_id = m.get("id")
                            if m_id:
                                models.append({"id": m_id, "name": m_id})
                except Exception:
                    pass
                    
    return models or GEMINI_MODELS

@router.get("/health")
async def check_services_health(session: Session = Depends(get_session)):
    """Pings provider endpoints and returns status."""
    g_key = os.environ.get("GEMINI_API_KEY")
    if not g_key:
        setting = session.get(Setting, "gemini_api_key")
        g_key = setting.value if setting else None

    async with httpx.AsyncClient(timeout=1.5) as http_client:
        results = {
            "backend": "running",
            "sqlite": "running",
            "gemini": "configured" if g_key and len(g_key.strip()) > 5 else "key_required",
            "lmstudio": "stopped",
            "vllm": "stopped",
        }

        # Check LM Studio
        try:
            res = await http_client.get("http://localhost:1234/v1/models")
            if res.status_code == 200:
                results["lmstudio"] = "running"
        except Exception:
            pass
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

@router.get("/system/status")
async def get_system_status():
    """Returns real live hardware and OS telemetry data."""
    try:
        import platform
        import time
        import psutil

        # OS Name
        os_name = "Linux"
        if os.path.exists("/etc/os-release"):
            with open("/etc/os-release") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        os_name = line.split("=")[1].strip().strip('"')
                        break
        
        kernel = platform.release()
        
        # Uptime
        boot_time = psutil.boot_time()
        uptime_sec = int(time.time() - boot_time)
        hours = uptime_sec // 3600
        mins = (uptime_sec % 3600) // 60
        uptime_str = f"{hours}h {mins}m"
        
        # Memory
        mem = psutil.virtual_memory()
        mem_used_gb = round(mem.used / (1024 ** 3), 1)
        mem_total_gb = round(mem.total / (1024 ** 3), 1)
        mem_percent = round(mem.percent, 1)

        # CPU
        cpu_percent = round(psutil.cpu_percent(interval=None), 1)

        # Storage
        disk = psutil.disk_usage('/')
        disk_used_gb = round(disk.used / (1024 ** 3), 1)
        disk_total_gb = round(disk.total / (1024 ** 3), 1)
        disk_percent = round(disk.percent, 1)

        return {
            "os": os_name,
            "kernel": kernel,
            "uptime": uptime_str,
            "memory": {
                "used_gb": mem_used_gb,
                "total_gb": mem_total_gb,
                "percent": mem_percent
            },
            "cpu": {
                "percent": cpu_percent
            },
            "storage": {
                "used_gb": disk_used_gb,
                "total_gb": disk_total_gb,
                "percent": disk_percent
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "os": "Linux",
            "kernel": platform.release(),
            "uptime": "N/A",
            "memory": {"used_gb": 0, "total_gb": 16, "percent": 0},
            "cpu": {"percent": 0},
            "storage": {"used_gb": 0, "total_gb": 512, "percent": 0}
        }


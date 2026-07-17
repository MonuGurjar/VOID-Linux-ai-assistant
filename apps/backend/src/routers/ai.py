from fastapi import APIRouter, Depends
from sqlmodel import Session
from openai import AsyncOpenAI
from ..db import get_session
from ..models.settings import Setting

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/models")
async def get_models(session: Session = Depends(get_session)):
    # Default to Ollama URL
    setting = session.get(Setting, "ai_base_url")
    base_url = setting.value if setting else "http://localhost:11434/v1"
    
    # We use empty api_key since local servers don't require it
    client = AsyncOpenAI(
        base_url=base_url,
        api_key="local-ai"
    )
    
    try:
        response = await client.models.list()
        # Return a list of model ids
        return [{"id": m.id, "name": m.id} for m in response.data]
    except Exception as e:
        # Fallback if the server is offline or fails
        print(f"Failed to fetch models from {base_url}: {e}")
        return []

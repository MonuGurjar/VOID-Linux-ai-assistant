import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone
import asyncio
import json
import httpx

from openai import AsyncOpenAI
from ..db import get_session, engine
from ..models.chat import Message, Conversation
from ..models.settings import Setting

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["chat"])

DEFAULT_PROVIDER_URLS = {
    "ollama": "http://localhost:11434/v1",
    "lmstudio": "http://localhost:1234/v1",
    "vllm": "http://localhost:8080/v1",
}

DEFAULT_SYSTEM_PROMPT = "You are VOID, an intelligent, privacy-first, offline Linux AI assistant. Help the user learn, automate, and operate their Linux system safely."

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@router.get("/", response_model=List[Message])
def get_messages(conversation_id: int, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = session.exec(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)).all()
    return messages

@router.post("/")
async def post_message(conversation_id: int, message: Message, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    req_provider = message.provider or "ollama"
    req_model = message.model
    req_system_prompt = message.system_prompt

    # 1. Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=message.content,
        provider=req_provider,
        model=req_model
    )
    session.add(user_msg)
    
    # 2. Update conversation timestamp
    conversation.updated_at = utc_now()
    session.add(conversation)
    session.commit()

    # 3. Retrieve context (last 20 messages)
    past_messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    ).all()
    
    # 4. Resolve Base URL & Model Name
    model_setting = session.get(Setting, "ai_model")
    model_name = req_model or (model_setting.value if model_setting else "void:latest")

    # 5. Resolve System Prompt
    system_setting = session.get(Setting, "system_prompt")
    system_prompt = req_system_prompt or (system_setting.value if system_setting else DEFAULT_SYSTEM_PROMPT)

    ai_messages = [{"role": "system", "content": system_prompt}]
    for m in past_messages[-20:]:
        if m.content and m.content.strip():
            ai_messages.append({"role": m.role, "content": m.content.strip()})

    async def generate_response():
        full_content = ""
        
        # Method A: Ollama Native Streaming API
        if req_provider == "ollama":
            try:
                async with httpx.AsyncClient(timeout=300.0) as http_client:
                    async with http_client.stream(
                        "POST",
                        "http://localhost:11434/api/chat",
                        json={
                            "model": model_name,
                            "messages": ai_messages,
                            "stream": True
                        }
                    ) as response:
                        if response.status_code != 200:
                            err_text = await response.aread()
                            raise Exception(f"Ollama error ({response.status_code}): {err_text.decode('utf-8', errors='ignore')}")

                        async for line in response.aiter_lines():
                            if not line or not line.strip():
                                continue
                            try:
                                data = json.loads(line)
                                msg = data.get("message", {})
                                content_piece = msg.get("content", "") or msg.get("thinking", "")
                                if content_piece:
                                    full_content += content_piece
                                    yield f"data: {json.dumps({'content': content_piece})}\n\n"
                                if data.get("done", False):
                                    break
                            except Exception:
                                continue
            except Exception as e:
                logger.error(f"Ollama native stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"
                if full_content and full_content.strip():
                    with Session(engine) as db_session:
                        assistant_msg = Message(
                            conversation_id=conversation_id,
                            role="assistant",
                            content=full_content.strip(),
                            model=model_name,
                            provider=req_provider
                        )
                        db_session.add(assistant_msg)
                        db_session.commit()
            return

        # Method B: OpenAI SDK for LM Studio, vLLM, Custom
        if req_provider in DEFAULT_PROVIDER_URLS:
            base_url = DEFAULT_PROVIDER_URLS[req_provider]
        elif req_provider == "custom":
            url_setting = session.get(Setting, "ai_custom_url")
            base_url = url_setting.value if url_setting else "http://localhost:8080/v1"
        else:
            url_setting = session.get(Setting, "ai_base_url")
            base_url = url_setting.value if url_setting else "http://localhost:11434/v1"

        client = AsyncOpenAI(
            base_url=base_url,
            api_key="local-ai",
            timeout=300.0
        )

        try:
            stream = await client.chat.completions.create(
                model=model_name,
                messages=ai_messages,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta:
                    delta = chunk.choices[0].delta
                    content = (
                        getattr(delta, "content", None) or
                        getattr(delta, "reasoning_content", None) or
                        getattr(delta, "reasoning", None) or
                        getattr(delta, "thinking", None)
                    )
                    if content:
                        full_content += content
                        yield f"data: {json.dumps({'content': content})}\n\n"
                    
        except Exception as e:
            logger.error(f"Error in LLM stream generation: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"
            if full_content and full_content.strip():
                with Session(engine) as db_session:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=full_content.strip(),
                        model=model_name,
                        provider=req_provider
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()

    return StreamingResponse(generate_response(), media_type="text/event-stream")

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone
import asyncio
import json
import httpx
import re

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

DEFAULT_SYSTEM_PROMPT = (
    "You are VOID, an intelligent, privacy-first, offline Linux AI assistant. "
    "Help the user learn, automate, and operate their Linux system safely. "
    "Respond directly and concisely to the user without outputting internal monologue or thinking steps."
)

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def strip_thinking_tags(text: str) -> str:
    """Strips <think>...</think> tags and raw monologue thinking prefixes from text."""
    clean = re.sub(r"<think>[\s\S]*?<\/think>", "", text).strip()
    # Strip un-tagged leading thinking monologue if model outputs it directly
    pattern = r"^(Okay|Let's|The user|Hmm|Wait|First, I|I should|I need)([\s\S]*?)(Hello!|Hi!|Hey!|Welcome|Sure!|Here is|Certainly!)"
    match = re.search(pattern, clean, re.IGNORECASE)
    if match:
        clean = match.group(3) + clean[match.end():]
    return clean.strip()

@router.get("/", response_model=List[Message])
def get_messages(conversation_id: int, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = session.exec(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)).all()
    # Clean thinking tags before returning stored messages to UI
    for m in messages:
        if m.role == "assistant" and m.content:
            m.content = strip_thinking_tags(m.content)
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

    # 5. Resolve System Prompt & Tools Context
    system_setting = session.get(Setting, "system_prompt")
    base_system_prompt = req_system_prompt or (system_setting.value if system_setting else DEFAULT_SYSTEM_PROMPT)

    # Auto-enrich system questions with live Linux system telemetry
    user_query_lower = message.content.lower()
    system_telemetry_suffix = ""
    if any(k in user_query_lower for k in ["linux", "distro", "distribution", "disk", "free space", "ram", "cpu", "system info", "os", "specs", "hardware", "kernel"]):
        try:
            from ..tools.builtin import SystemInfoTool
            sys_data = await SystemInfoTool().execute()
            system_telemetry_suffix = (
                f"\n\n[LIVE LINUX SYSTEM TELEMETRY]\n"
                f"- OS / Distro: {sys_data.get('distro')} (Kernel {sys_data.get('kernel_release')}, {sys_data.get('machine')})\n"
                f"- CPU Model: {sys_data.get('cpu_model')} ({sys_data.get('cpu_cores_physical')} physical cores / {sys_data.get('cpu_cores_logical')} logical threads)\n"
                f"- CPU Load: {sys_data.get('cpu_usage_percent')}%\n"
                f"- RAM Usage: {sys_data.get('ram_used_gb')} GB / {sys_data.get('ram_total_gb')} GB ({sys_data.get('ram_percent')}%)\n"
                f"- Disk Space: {sys_data.get('disk_free_gb')} GB free out of {sys_data.get('disk_total_gb')} GB ({sys_data.get('disk_percent')}% used)\n"
                f"Answer the user's question directly using this live hardware & system telemetry data."
            )
        except Exception as e:
            logger.warning(f"Failed to auto-fetch system telemetry: {e}")

    full_system_prompt = base_system_prompt + system_telemetry_suffix

    ai_messages = [{"role": "system", "content": full_system_prompt}]
    for m in past_messages[-20:]:
        if m.content and m.content.strip():
            clean_content = strip_thinking_tags(m.content.strip())
            if clean_content:
                ai_messages.append({"role": m.role, "content": clean_content})

    async def generate_response():
        full_thinking = ""
        full_response = ""
        
        # Method A: Ollama Native Streaming API with structured thinking payload
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
                                thinking_piece = msg.get("thinking", "")
                                content_piece = msg.get("content", "")

                                if thinking_piece:
                                    full_thinking += thinking_piece
                                    # Send thinking explicitly under 'thinking' key
                                    yield f"data: {json.dumps({'thinking': thinking_piece})}\n\n"
                                elif content_piece:
                                    full_response += content_piece
                                    # Send response explicitly under 'content' key
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
                
                # Format final stored content with <think> tag if thinking exists, otherwise clean response
                final_saved_content = f"<think>\n{full_thinking.strip()}\n</think>\n\n{full_response.strip()}" if full_thinking.strip() else full_response.strip()
                
                if final_saved_content and final_saved_content.strip():
                    with Session(engine) as db_session:
                        assistant_msg = Message(
                            conversation_id=conversation_id,
                            role="assistant",
                            content=final_saved_content.strip(),
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
                    thinking_piece = getattr(delta, "reasoning_content", None) or getattr(delta, "thinking", None)
                    content_piece = getattr(delta, "content", None)

                    if thinking_piece:
                        full_thinking += thinking_piece
                        yield f"data: {json.dumps({'thinking': thinking_piece})}\n\n"
                    elif content_piece:
                        full_response += content_piece
                        yield f"data: {json.dumps({'content': content_piece})}\n\n"
                    
        except Exception as e:
            logger.error(f"Error in LLM stream generation: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"
            final_saved_content = f"<think>\n{full_thinking.strip()}\n</think>\n\n{full_response.strip()}" if full_thinking.strip() else full_response.strip()
            if final_saved_content and final_saved_content.strip():
                with Session(engine) as db_session:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=final_saved_content.strip(),
                        model=model_name,
                        provider=req_provider
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()

    return StreamingResponse(generate_response(), media_type="text/event-stream")

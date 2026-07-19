import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone
import asyncio
import json

from openai import AsyncOpenAI
from ..db import get_session, engine
from ..models.chat import Message, Conversation
from ..models.settings import Setting

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["chat"])

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

    # 1. Save user message
    message.conversation_id = conversation_id
    message.role = "user"
    session.add(message)
    
    # 2. Update conversation timestamp
    conversation.updated_at = utc_now()
    session.add(conversation)
    session.commit()
    session.refresh(message)

    # 3. Retrieve context (last 20 messages with non-empty content)
    past_messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    ).all()
    
    # Clean and format for OpenAI / Ollama payload (filter out empty or whitespace-only messages)
    ai_messages = [
        {"role": m.role, "content": m.content.strip()}
        for m in past_messages[-20:]
        if m.content and m.content.strip()
    ]

    # Get settings for Base URL and Model
    url_setting = session.get(Setting, "ai_base_url")
    model_setting = session.get(Setting, "ai_model")
    
    base_url = url_setting.value if url_setting else "http://localhost:11434/v1"
    model_name = model_setting.value if model_setting else "gemma:2b"

    client = AsyncOpenAI(
        base_url=base_url,
        api_key="local-ai"
    )

    async def generate_response():
        full_content = ""
        try:
            stream = await client.chat.completions.create(
                model=model_name,
                messages=ai_messages,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    # yield SSE formatted chunk
                    yield f"data: {json.dumps({'content': content})}\n\n"
                    
        except Exception as e:
            logger.error(f"Error in LLM stream generation: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            # Send done signal
            yield "data: [DONE]\n\n"
            
            # Save assistant message to DB ONLY if we actually got non-empty response content
            if full_content and full_content.strip():
                with Session(engine) as db_session:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=full_content.strip()
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()

    return StreamingResponse(generate_response(), media_type="text/event-stream")

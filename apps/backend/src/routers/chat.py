from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone
import asyncio

from ..db import get_session
from ..models.chat import Message, Conversation

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

@router.post("/", response_model=Message)
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

    # 3. Generate mock assistant response (Phase 1)
    await asyncio.sleep(1) # simulate delay
    
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=f"This is a mock response to: '{message.content}'. Local AI integration will come in Phase 2!"
    )
    session.add(assistant_msg)
    session.commit()
    session.refresh(assistant_msg)
    
    return assistant_msg

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from ..db import get_session
from pydantic import BaseModel
from ..models.chat import Conversation, Message

class ConversationUpdate(BaseModel):
    title: str

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/", response_model=List[Conversation])
def get_conversations(session: Session = Depends(get_session)):
    conversations = session.exec(select(Conversation).order_by(Conversation.updated_at.desc())).all()
    return conversations

@router.post("/", response_model=Conversation)
def create_conversation(conversation: Conversation, session: Session = Depends(get_session)):
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete associated messages first
    messages = session.exec(select(Message).where(Message.conversation_id == conversation_id)).all()
    for msg in messages:
        session.delete(msg)
        
    session.delete(conversation)
    session.commit()
    return {"ok": True}

@router.patch("/{conversation_id}")
def rename_conversation(conversation_id: int, update_data: ConversationUpdate, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = update_data.title
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation

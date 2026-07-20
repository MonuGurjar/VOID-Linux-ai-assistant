from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    messages: List["Message"] = Relationship(back_populates="conversation")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str  # 'user', 'assistant', 'system'
    content: str
    model: Optional[str] = Field(default=None)
    provider: Optional[str] = Field(default=None)
    system_prompt: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)

    conversation: Conversation = Relationship(back_populates="messages")

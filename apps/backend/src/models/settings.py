from sqlmodel import SQLModel, Field
from typing import Optional

class Setting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str

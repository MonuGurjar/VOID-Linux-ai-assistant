from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict

from ..db import get_session
from ..models.settings import Setting

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
def get_all_settings(session: Session = Depends(get_session)) -> Dict[str, str]:
    settings = session.exec(select(Setting)).all()
    return {s.key: s.value for s in settings}

@router.post("/")
def update_settings(new_settings: Dict[str, str], session: Session = Depends(get_session)):
    for key, value in new_settings.items():
        setting = session.get(Setting, key)
        if setting:
            setting.value = value
            session.add(setting)
        else:
            new_setting = Setting(key=key, value=value)
            session.add(new_setting)
    session.commit()
    return {"status": "success"}

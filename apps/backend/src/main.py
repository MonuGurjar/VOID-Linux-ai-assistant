from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .db import create_db_and_tables
from .routers import conversations, chat, settings, ai, tools

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VOID Assistant API", version="1.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a local desktop app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(settings.router)
app.include_router(ai.router)
app.include_router(tools.router)
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing VOID Backend...")
    create_db_and_tables()
    # TODO: Initialize Qdrant Client

@app.get("/")
def read_root():
    return {"status": "ok", "message": "VOID Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

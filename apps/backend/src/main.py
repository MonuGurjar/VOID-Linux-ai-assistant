from fastapi import FastAPI
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VOID Assistant API", version="1.0")

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing VOID Backend...")
    # TODO: Initialize SQLite via SQLModel
    # TODO: Initialize Qdrant Client

@app.get("/")
def read_root():
    return {"status": "ok", "message": "VOID Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

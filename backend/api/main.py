import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routers import health, ingest, notes, query, sessions

REQUIRED_ENV_VARS = ["WEAVIATE_URL", "WEAVIATE_API_KEY", "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
missing = [v for v in REQUIRED_ENV_VARS if not os.environ.get(v)]
if missing:
    raise RuntimeError(f"Missing required environment variable(s): {', '.join(missing)}")

app = FastAPI(
    title="Multimodal RAG API",
    description="Ingest documents and query them with natural language.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(notes.router)

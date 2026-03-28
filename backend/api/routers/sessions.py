from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import src.notes.supabase_store as db
from api.dependencies import get_pipeline
from src.rag.pipeline_manager import PipelineManager

router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionRequest(BaseModel):
    user_id: str          # external_id (e.g. email)
    name: str = "Untitled Session"


@router.post("", response_model=dict, summary="Create a new session")
def create_session(body: CreateSessionRequest):
    user = db.get_or_create_user(body.user_id)
    session = db.create_session(user["id"], body.name)
    return {**session, "user_external_id": body.user_id}


@router.get("/user/{user_id}", response_model=list[dict], summary="List all sessions for a user")
def list_sessions(user_id: str):
    """user_id is the external_id (e.g. email)."""
    user = db.get_or_create_user(user_id)
    return db.list_sessions(user["id"])


@router.get("/{session_id}", response_model=dict, summary="Get session details")
def get_session(session_id: str):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session


@router.delete("/{session_id}", response_model=dict, summary="Delete a session and all its documents")
def delete_session(session_id: str, pipeline: PipelineManager = Depends(get_pipeline)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    # Remove from Weaviate
    pipeline.delete_session_documents(session_id)
    # Remove from Supabase (storage + DB)
    db.delete_session(session_id)
    return {"deleted": True, "session_id": session_id}


@router.get("/{session_id}/documents", response_model=list[dict], summary="List documents in a session")
def list_session_documents(session_id: str):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return db.list_documents_for_session(session_id)

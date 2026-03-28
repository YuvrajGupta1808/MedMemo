"""Supabase integration: storage bucket uploads and document/session DB records."""
import os
import uuid
from dataclasses import dataclass

from supabase import Client, create_client

from src.notes.note_taker import TranscriptResult

BUCKET = "documents"


def _client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_or_create_user(external_id: str) -> dict:
    """Return existing user row or create one for the given external_id."""
    sb = _client()
    res = sb.table("users").select("*").eq("external_id", external_id).limit(1).execute()
    if res.data:
        return res.data[0]
    res = sb.table("users").insert({"external_id": external_id}).execute()
    return res.data[0]


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def create_session(user_id: str, name: str = "Untitled Session") -> dict:
    sb = _client()
    res = sb.table("sessions").insert({"user_id": user_id, "name": name}).execute()
    return res.data[0]


def list_sessions(user_id: str) -> list[dict]:
    sb = _client()
    res = (
        sb.table("sessions")
        .select("id, name, created_at, updated_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def get_session(session_id: str) -> dict | None:
    sb = _client()
    res = sb.table("sessions").select("*").eq("id", session_id).limit(1).execute()
    return res.data[0] if res.data else None


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

def upload_file(file_bytes: bytes, file_name: str, content_type: str, user_id: str, session_id: str) -> str:
    """Upload file to Supabase Storage and return the storage path."""
    sb = _client()
    ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
    storage_path = f"{user_id}/{session_id}/{uuid.uuid4()}.{ext}"
    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    return storage_path


def create_document_record(
    user_id: str,
    session_id: str,
    file_name: str,
    file_type: str,
    storage_path: str,
) -> dict:
    sb = _client()
    res = sb.table("documents").insert({
        "user_id": user_id,
        "session_id": session_id,
        "file_name": file_name,
        "file_type": file_type,
        "storage_path": storage_path,
        "status": "pending",
    }).execute()
    return res.data[0]


def update_document_status(document_id: str, status: str, pages_ingested: int = 0) -> None:
    sb = _client()
    sb.table("documents").update({
        "status": status,
        "pages_ingested": pages_ingested,
    }).eq("id", document_id).execute()


def list_documents_for_session(session_id: str) -> list[dict]:
    sb = _client()
    res = (
        sb.table("documents")
        .select("id, file_name, file_type, status, pages_ingested, created_at")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return res.data


def delete_document(document_id: str) -> dict | None:
    """Delete document record from DB and its file from storage. Returns deleted row or None."""
    sb = _client()
    # Get the record first to find storage_path
    res = sb.table("documents").select("*").eq("id", document_id).limit(1).execute()
    if not res.data:
        return None
    doc = res.data[0]
    # Delete from storage (best-effort)
    try:
        sb.storage.from_(BUCKET).remove([doc["storage_path"]])
    except Exception:
        pass
    # Delete from DB
    sb.table("documents").delete().eq("id", document_id).execute()
    return doc


def delete_session(session_id: str) -> dict | None:
    """Delete session and all its documents from DB + storage. Returns deleted session or None."""
    sb = _client()
    # Get session
    res = sb.table("sessions").select("*").eq("id", session_id).limit(1).execute()
    if not res.data:
        return None
    session = res.data[0]
    # Get all documents for session
    docs_res = sb.table("documents").select("storage_path").eq("session_id", session_id).execute()
    if docs_res.data:
        paths = [d["storage_path"] for d in docs_res.data if d.get("storage_path")]
        if paths:
            try:
                sb.storage.from_(BUCKET).remove(paths)
            except Exception:
                pass
    # Delete document records
    sb.table("documents").delete().eq("session_id", session_id).execute()
    # Delete the session
    sb.table("sessions").delete().eq("id", session_id).execute()
    return session


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------

def upload_audio(file_bytes: bytes, file_name: str, mime_type: str, user_id: str, session_id: str) -> str:
    """Upload audio to Supabase Storage and return the storage path."""
    sb = _client()
    ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
    storage_path = f"{user_id}/{session_id}/{uuid.uuid4()}.{ext}"
    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": mime_type, "upsert": "false"},
    )
    return storage_path


def save_note(user_id: str, session_id: str, audio_storage_path: str, transcript: TranscriptResult) -> dict:
    """Insert a note row into the notes table and return the inserted row."""
    sb = _client()
    res = sb.table("notes").insert({
        "user_id": user_id,
        "session_id": session_id,
        "audio_path": audio_storage_path,
        "summary": transcript["summary"],
        "segments": transcript["segments"],
    }).execute()
    return res.data[0]


def list_notes(session_id: str) -> list[dict]:
    """Return all notes for a session ordered by creation time ascending."""
    sb = _client()
    res = (
        sb.table("notes")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return res.data


def get_audio_url(storage_path: str, expires_in: int = 3600) -> str:
    """Return a signed URL for the given storage path."""
    sb = _client()
    response = sb.storage.from_(BUCKET).create_signed_url(storage_path, expires_in)
    return response["signedURL"]


def download_audio(storage_path: str) -> bytes:
    """Download audio bytes from Supabase storage."""
    sb = _client()
    return sb.storage.from_(BUCKET).download(storage_path)

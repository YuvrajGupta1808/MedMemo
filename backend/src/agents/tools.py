"""Railtracks function_node tools for MedNemo agent operations."""
import railtracks as rt

import src.notes.supabase_store as db
from src.rag.pipeline_manager import PipelineManager

_pipeline = PipelineManager()  # module-level singleton


@rt.function_node
def create_patient_session(name: str) -> str:
    """Create a new patient session for the current user.
    Args:
        name: Human-readable session name (e.g. "John Doe visit 2026-03-28").
    Returns:
        Confirmation with the new session ID.
    """
    user_id = rt.context.get("user_id")
    user = db.get_or_create_user(user_id)
    session = db.create_session(user["id"], name)
    rt.context.put("session_id", session["id"])  # store for subsequent tools
    return f"Session '{name}' created with ID: {session['id']}"


@rt.function_node
def list_patient_sessions() -> str:
    """List all existing patient sessions for the current user.
    Returns:
        Formatted list of session names and IDs.
    """
    user_id = rt.context.get("user_id")
    user = db.get_or_create_user(user_id)
    sessions = db.list_sessions(user["id"])
    if not sessions:
        return "No sessions found."
    lines = [f"- {s['name']} (ID: {s['id']})" for s in sessions]
    return "Sessions:\n" + "\n".join(lines)


@rt.function_node
def ingest_document(file_path: str, file_type: str) -> str:
    """Ingest a medical document (PDF, JPEG, PNG) into the current patient session.
    Args:
        file_path: Absolute path to the document on disk.
        file_type: One of 'pdf', 'jpeg', or 'png'.
    Returns:
        Confirmation with the number of pages ingested.
    """
    user_id = rt.context.get("user_id")
    session_id = rt.context.get("session_id")
    user = db.get_or_create_user(user_id)
    internal_uid = user["id"]

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    content_type = {"pdf": "application/pdf", "jpeg": "image/jpeg", "png": "image/png"}[file_type]
    storage_path = db.upload_file(file_bytes, file_path.split("/")[-1], content_type, internal_uid, session_id)
    doc = db.create_document_record(internal_uid, session_id, file_path.split("/")[-1], file_type, storage_path)
    db.update_document_status(doc["id"], "processing")
    pages = _pipeline.ingest(file_bytes, doc["id"], file_type, internal_uid, session_id)
    db.update_document_status(doc["id"], "ingested", pages)
    return f"Ingested '{file_path.split('/')[-1]}' — {pages} page(s) stored in session."


@rt.function_node
def query_patient_documents(question: str, limit: int = 3) -> str:
    """Query the patient session documents with a clinical question using RAG.
    Args:
        question: Natural language clinical question.
        limit: Number of document pages to retrieve (default 3, max 10).
    Returns:
        AI-generated answer based on the retrieved document pages.
    """
    session_id = rt.context.get("session_id")
    result = _pipeline.query(question, limit=min(limit, 10), session_id=session_id)
    answer = result.get("answer", "No answer generated.")
    pages = result.get("pages", [])
    page_refs = ", ".join(
        f"doc {p.get('document_id', '')[:8]}… p.{p.get('page_number', '?')}"
        for p in pages
        if p.get("document_type") != "transcript"
    )
    return f"Answer: {answer}\n\nSources: {page_refs if page_refs else 'transcript/audio notes'}"


@rt.function_node
def transcribe_clinical_audio(audio_path: str, mime_type: str = "audio/wav") -> str:
    """Transcribe a clinical audio recording with speaker diarization and ingest it into RAG.
    Args:
        audio_path: Absolute path to the audio file on disk.
        mime_type: Audio MIME type (e.g. 'audio/wav', 'audio/mp3').
    Returns:
        Clinical summary and transcript confirmation.
    """
    from src.notes.note_taker import NoteTaker

    user_id = rt.context.get("user_id")
    session_id = rt.context.get("session_id")
    user = db.get_or_create_user(user_id)
    internal_uid = user["id"]

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    storage_path = db.upload_audio(audio_bytes, audio_path.split("/")[-1], mime_type, internal_uid, session_id)
    transcript = NoteTaker().transcribe(audio_bytes, mime_type)
    note = db.save_note(internal_uid, session_id, storage_path, transcript)
    _pipeline.ingest_transcript(transcript, note["id"], internal_uid, session_id)
    return (
        f"Transcription complete. Summary: {transcript['summary']}\n"
        f"{len(transcript['segments'])} speaker segment(s) ingested into RAG."
    )


@rt.function_node
def list_session_documents() -> str:
    """List all documents ingested in the current patient session.
    Returns:
        Formatted list of documents with status and page counts.
    """
    session_id = rt.context.get("session_id")
    docs = db.list_documents_for_session(session_id)
    if not docs:
        return "No documents in this session."
    icons = {"ingested": "✅", "processing": "⏳", "failed": "❌", "pending": "🕐"}
    lines = [f"{icons.get(d['status'], '?')} {d['file_name']} — {d['pages_ingested']} page(s)" for d in docs]
    return "Documents:\n" + "\n".join(lines)


@rt.function_node
def list_session_notes() -> str:
    """List all clinical audio notes for the current patient session.
    Returns:
        Formatted list of notes with summaries.
    """
    session_id = rt.context.get("session_id")
    notes = db.list_notes(session_id)
    if not notes:
        return "No clinical notes in this session."
    lines = [f"[{n['created_at']}] {n['summary']}" for n in notes]
    return "Clinical Notes:\n" + "\n".join(lines)

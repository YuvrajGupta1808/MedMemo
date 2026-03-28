"""Railtracks function_node tools for MedNemo agent operations."""
import base64
import logging
import os

import railtracks as rt

import src.notes.supabase_store as db
from src.rag.pipeline_manager import PipelineManager

logger = logging.getLogger("RT.mednemo.tools")

_pipeline = PipelineManager()  # module-level singleton


@rt.function_node
def create_patient_session(name: str) -> str:
    """Create a new patient session for the current user.
    Args:
        name: Human-readable session name (e.g. "John Doe visit 2026-03-28").
    Returns:
        Confirmation with the new session ID.
    """
    try:
        user_id = rt.context.get("user_id")
        logger.info(f"Creating session '{name}' for user {user_id}")
        user = db.get_or_create_user(user_id)
        session = db.create_session(user["id"], name)
        rt.context.put("session_id", session["id"])  # store for subsequent tools
        logger.info(f"Session created: {session['id']}")
        return f"Session '{name}' created with ID: {session['id']}"
    except Exception as e:
        logger.error(f"create_patient_session failed: {e}", exc_info=True)
        return f"Error in create_patient_session: {e}"


@rt.function_node
def list_patient_sessions() -> str:
    """List all existing patient sessions for the current user.
    Returns:
        Formatted list of session names and IDs.
    """
    try:
        user_id = rt.context.get("user_id")
        logger.info(f"Listing sessions for user {user_id}")
        user = db.get_or_create_user(user_id)
        sessions = db.list_sessions(user["id"])
        if not sessions:
            logger.info("Found 0 session(s)")
            return "No sessions found."
        logger.info(f"Found {len(sessions)} session(s)")
        lines = [f"- {s['name']} (ID: {s['id']})" for s in sessions]
        return "Sessions:\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"list_patient_sessions failed: {e}", exc_info=True)
        return f"Error in list_patient_sessions: {e}"


@rt.function_node
def ingest_document(file_path: str, file_type: str = "") -> str:
    """Ingest a medical document (PDF, JPEG, PNG) into the current patient session.
    Args:
        file_path: Absolute path to the document on disk.
        file_type: One of 'pdf', 'jpeg', or 'png'. Auto-detected from extension if omitted.
    Returns:
        Confirmation with the number of pages ingested.
    """
    try:
        logger.info(f"Ingesting: {file_path} (type={file_type})")
        if not file_type:
            ext = os.path.splitext(file_path)[1].lower().lstrip(".")
            ext_map = {"pdf": "pdf", "jpg": "jpeg", "jpeg": "jpeg", "png": "png"}
            file_type = ext_map.get(ext, "")
            if not file_type:
                return f"Error: cannot detect file type from '{file_path}'. Provide file_type explicitly."
            logger.info(f"Detected file_type: {file_type}")

        file_name = os.path.basename(file_path)
        user_id = rt.context.get("user_id")
        session_id = rt.context.get("session_id")
        user = db.get_or_create_user(user_id)
        internal_uid = user["id"]

        with open(file_path, "rb") as f:
            file_bytes = f.read()
        logger.info(f"Read {len(file_bytes)} bytes from disk")

        content_type = {"pdf": "application/pdf", "jpeg": "image/jpeg", "png": "image/png"}[file_type]
        storage_path = db.upload_file(file_bytes, file_name, content_type, internal_uid, session_id)
        logger.info(f"Uploaded to storage: {storage_path}")
        doc = db.create_document_record(internal_uid, session_id, file_name, file_type, storage_path)
        logger.info(f"Document record: {doc['id']}")
        db.update_document_status(doc["id"], "processing")
        logger.info("Processing pages...")
        pages = _pipeline.ingest(file_bytes, doc["id"], file_type, internal_uid, session_id)
        db.update_document_status(doc["id"], "ingested", pages)
        logger.info(f"Ingestion complete: {pages} page(s) for {file_name}")
        return f"Ingested '{file_name}' — {pages} page(s) stored in session."
    except Exception as e:
        logger.error(f"ingest_document failed: {e}", exc_info=True)
        return f"Error in ingest_document: {e}"


@rt.function_node
def query_patient_documents(question: str, limit: int = 3) -> str:
    """Query the patient session documents with a clinical question using RAG.
    Args:
        question: Natural language clinical question.
        limit: Number of document pages to retrieve (default 3, max 10).
    Returns:
        AI-generated answer based on the retrieved document pages.
    """
    try:
        session_id = rt.context.get("session_id")
        logger.info(f"Querying: '{question[:80]}' limit={limit} session={session_id}")
        result = _pipeline.query(question, limit=min(limit, 10), session_id=session_id)
        answer = result.get("answer", "No answer generated.")
        pages = result.get("pages", [])
        logger.info(f"Query returned {len(pages)} page(s)")
        page_refs = ", ".join(
            f"doc {p.get('document_id', '')[:8]}… p.{p.get('page_number', '?')}"
            for p in pages
            if p.get("document_type") != "transcript"
        )
        return f"Answer: {answer}\n\nSources: {page_refs if page_refs else 'transcript/audio notes'}"
    except Exception as e:
        logger.error(f"query_patient_documents failed: {e}", exc_info=True)
        return f"Error in query_patient_documents: {e}"


@rt.function_node
def transcribe_clinical_audio(audio_path: str, mime_type: str = "audio/wav") -> str:
    """Transcribe a clinical audio recording with speaker diarization and ingest it into RAG.
    Args:
        audio_path: Absolute path to the audio file on disk.
        mime_type: Audio MIME type (e.g. 'audio/wav', 'audio/mp3').
    Returns:
        Clinical summary and transcript confirmation.
    """
    try:
        from src.notes.note_taker import NoteTaker

        logger.info(f"Transcribing: {audio_path} ({mime_type})")
        user_id = rt.context.get("user_id")
        session_id = rt.context.get("session_id")
        user = db.get_or_create_user(user_id)
        internal_uid = user["id"]

        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        logger.info(f"Read {len(audio_bytes)} bytes of audio")

        storage_path = db.upload_audio(audio_bytes, audio_path.split("/")[-1], mime_type, internal_uid, session_id)
        logger.info("Uploaded audio to storage")
        logger.info("Running Gemini transcription...")
        transcript = NoteTaker().transcribe(audio_bytes, mime_type)
        logger.info(f"Transcription: {len(transcript['segments'])} segments")
        note = db.save_note(internal_uid, session_id, storage_path, transcript)
        _pipeline.ingest_transcript(transcript, note["id"], internal_uid, session_id)
        logger.info("Transcript ingested into RAG")
        return (
            f"Transcription complete. Summary: {transcript['summary']}\n"
            f"{len(transcript['segments'])} speaker segment(s) ingested into RAG."
        )
    except Exception as e:
        logger.error(f"transcribe_clinical_audio failed: {e}", exc_info=True)
        return f"Error in transcribe_clinical_audio: {e}"


@rt.function_node
def list_session_documents() -> str:
    """List all documents ingested in the current patient session.
    Returns:
        Formatted list of documents with status and page counts.
    """
    try:
        session_id = rt.context.get("session_id")
        logger.info(f"Listing docs for session {session_id}")
        docs = db.list_documents_for_session(session_id)
        if not docs:
            logger.info("Found 0 document(s)")
            return "No documents in this session."
        logger.info(f"Found {len(docs)} document(s)")
        icons = {"ingested": "✅", "processing": "⏳", "failed": "❌", "pending": "🕐"}
        lines = [f"{icons.get(d['status'], '?')} {d['file_name']} — {d['pages_ingested']} page(s)" for d in docs]
        return "Documents:\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"list_session_documents failed: {e}", exc_info=True)
        return f"Error in list_session_documents: {e}"


@rt.function_node
def list_session_notes() -> str:
    """List all clinical audio notes for the current patient session.
    Returns:
        Formatted list of notes with summaries.
    """
    try:
        session_id = rt.context.get("session_id")
        logger.info(f"Listing notes for session {session_id}")
        notes = db.list_notes(session_id)
        if not notes:
            logger.info("Found 0 note(s)")
            return "No clinical notes in this session."
        logger.info(f"Found {len(notes)} note(s)")
        lines = [f"[{n['created_at']}] {n['summary']}" for n in notes]
        return "Clinical Notes:\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"list_session_notes failed: {e}", exc_info=True)
        return f"Error in list_session_notes: {e}"


@rt.function_node
def get_session_details(session_id: str) -> str:
    """Get details about a specific patient session.
    Args:
        session_id: The session UUID.
    Returns:
        Session details including name, creation date, and ID.
    """
    try:
        logger.info(f"Getting session details: {session_id}")
        session = db.get_session(session_id)
        if not session:
            return f"Session '{session_id}' not found."
        logger.info(f"Session found: {session['name']}")
        return f"Session: {session['name']}\nID: {session['id']}\nCreated: {session.get('created_at', 'unknown')}"
    except Exception as e:
        logger.error(f"get_session_details failed: {e}", exc_info=True)
        return f"Error in get_session_details: {e}"


@rt.function_node
def delete_session(session_id: str) -> str:
    """Delete a patient session and ALL its documents permanently.
    Args:
        session_id: The session UUID to delete.
    Returns:
        Confirmation of deletion.
    """
    try:
        logger.info(f"Deleting session: {session_id}")
        session = db.get_session(session_id)
        if not session:
            return f"Session '{session_id}' not found."
        _pipeline.delete_session_documents(session_id)
        db.delete_session(session_id)
        logger.info(f"Session deleted: {session_id}")
        return f"Session '{session['name']}' (ID: {session_id}) and all its documents have been permanently deleted."
    except Exception as e:
        logger.error(f"delete_session failed: {e}", exc_info=True)
        return f"Error in delete_session: {e}"


@rt.function_node
def delete_document(document_id: str) -> str:
    """Delete a specific document from the system permanently.
    Args:
        document_id: The document UUID to delete.
    Returns:
        Confirmation of deletion.
    """
    try:
        logger.info(f"Deleting document: {document_id}")
        doc = db.delete_document(document_id)
        if not doc:
            return f"Document '{document_id}' not found."
        _pipeline.delete_document(document_id)
        logger.info(f"Document deleted: {document_id}")
        return f"Document '{doc.get('file_name', document_id)}' has been permanently deleted."
    except Exception as e:
        logger.error(f"delete_document failed: {e}", exc_info=True)
        return f"Error in delete_document: {e}"


@rt.function_node
def switch_session(session_id: str) -> str:
    """Switch the active patient session. All subsequent queries and operations will use this session.
    Args:
        session_id: The session UUID to switch to.
    Returns:
        Confirmation of the switch with session details.
    """
    try:
        logger.info(f"Switching to session: {session_id}")
        session = db.get_session(session_id)
        if not session:
            return f"Session '{session_id}' not found."
        rt.context.put("session_id", session_id)
        logger.info(f"Switched to session: {session['name']} ({session_id})")
        return f"Switched to session '{session['name']}' (ID: {session_id}). All queries will now search this session's documents."
    except Exception as e:
        logger.error(f"switch_session failed: {e}", exc_info=True)
        return f"Error in switch_session: {e}"

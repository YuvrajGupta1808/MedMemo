from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

import src.notes.supabase_store as db
from api.dependencies import get_pipeline
from src.notes.note_taker import NoteTaker
from src.rag.pipeline_manager import PipelineManager

router = APIRouter(prefix="/notes", tags=["notes"])

SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/mp4",
}


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class AudioUploadResponse(BaseModel):
    storage_path: str
    audio_url: str


class TranscriptSegmentModel(BaseModel):
    timestamp: str
    speaker: str
    text: str


class NoteResponse(BaseModel):
    note_id: str
    session_id: str
    summary: str
    segments: list[TranscriptSegmentModel]
    audio_url: str
    created_at: str


class TranscribeRequest(BaseModel):
    storage_path: str
    user_id: str
    session_id: str
    mime_type: str = "audio/wav"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=AudioUploadResponse, summary="Upload audio to Supabase storage")
async def upload_audio(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),
    session_id: str = Form(...),
) -> AudioUploadResponse:
    """Upload an audio file to Supabase storage and return the storage path + signed URL.

    The frontend can use the signed URL to play back the audio immediately.
    Pass the storage_path to POST /notes/transcribe to trigger transcription.
    """
    mime_type = audio_file.content_type
    if mime_type not in SUPPORTED_AUDIO_MIME_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported audio format: {mime_type}")

    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user = db.get_or_create_user(user_id)
    internal_user_id = user["id"]

    try:
        storage_path = db.upload_audio(
            file_bytes=audio_bytes,
            file_name=audio_file.filename or f"upload.{mime_type.split('/')[-1]}",
            mime_type=mime_type,
            user_id=internal_user_id,
            session_id=session_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Audio storage failed: {exc}") from exc

    audio_url = db.get_audio_url(storage_path)
    return AudioUploadResponse(storage_path=storage_path, audio_url=audio_url)


@router.post("/transcribe", response_model=NoteResponse, summary="Transcribe an uploaded audio file")
async def transcribe_audio(
    body: TranscribeRequest,
    pipeline: PipelineManager = Depends(get_pipeline),
) -> NoteResponse:
    """Fetch audio from Supabase storage, transcribe it with speaker diarization,
    save the note, and ingest the transcript into the RAG pipeline.

    Expects a storage_path returned by POST /notes/upload.
    """
    session = db.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user = db.get_or_create_user(body.user_id)
    internal_user_id = user["id"]

    try:
        audio_bytes = db.download_audio(body.storage_path)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch audio from storage: {exc}") from exc

    try:
        transcript = NoteTaker().transcribe(audio_bytes, body.mime_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {exc}") from exc

    note_record = db.save_note(internal_user_id, body.session_id, body.storage_path, transcript)
    audio_url = db.get_audio_url(body.storage_path)

    # Ingest transcript into RAG so it's queryable alongside documents
    pipeline.ingest_transcript(
        transcript=transcript,
        document_id=note_record["id"],
        user_id=internal_user_id,
        session_id=body.session_id,
    )

    return NoteResponse(
        note_id=note_record["id"],
        session_id=body.session_id,
        summary=transcript["summary"],
        segments=[TranscriptSegmentModel(**seg) for seg in transcript["segments"]],
        audio_url=audio_url,
        created_at=note_record["created_at"],
    )


@router.get("/{session_id}", response_model=list[NoteResponse], summary="List notes for a session")
def list_notes(session_id: str, user_id: str = Query(...)) -> list[NoteResponse]:
    """Return all notes for a session with signed audio URLs."""
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    notes = db.list_notes(session_id)
    return [
        NoteResponse(
            note_id=note["id"],
            session_id=note["session_id"],
            summary=note["summary"],
            segments=[TranscriptSegmentModel(**seg) for seg in note["segments"]],
            audio_url=db.get_audio_url(note["audio_path"]),
            created_at=note["created_at"],
        )
        for note in notes
    ]

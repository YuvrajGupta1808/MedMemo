import base64
import os
from datetime import datetime
from pathlib import Path

import streamlit as st
from audio_recorder_streamlit import audio_recorder
from dotenv import load_dotenv

load_dotenv()

from src.rag.pipeline_manager import PipelineManager
import src.notes.supabase_store as db
from src.notes.note_taker import NoteTaker

st.set_page_config(page_title="Multimodal RAG", layout="wide")

# --- Env check ---
REQUIRED_ENV_VARS = ["WEAVIATE_URL", "WEAVIATE_API_KEY", "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
missing = [v for v in REQUIRED_ENV_VARS if not os.environ.get(v)]
if missing:
    st.error(f"Missing env var(s): {', '.join(missing)}. Set them in .env and restart.")
    st.stop()


@st.cache_resource
def get_pipeline() -> PipelineManager:
    return PipelineManager()


pipeline = get_pipeline()

# ---------------------------------------------------------------------------
# Sidebar — identity + session management
# ---------------------------------------------------------------------------
with st.sidebar:
    st.title("Multimodal RAG")

    # Connection status
    try:
        ready = pipeline.is_ready()
    except Exception:
        ready = False
    st.markdown("🟢 Weaviate connected" if ready else "🔴 Weaviate disconnected")
    st.divider()

    # User identity
    st.subheader("User")
    user_id_input = st.text_input("Your user ID (email or name)", value="demo-user")

    if not user_id_input.strip():
        st.warning("Enter a user ID to continue.")
        st.stop()

    user = db.get_or_create_user(user_id_input.strip())
    internal_user_id = user["id"]

    st.divider()

    # Session management
    st.subheader("Sessions")

    # Create new session
    with st.expander("➕ New session"):
        new_session_name = st.text_input("Session name", value="", key="new_session_name")
        if st.button("Create", key="create_session_btn"):
            if new_session_name.strip():
                new_sess = db.create_session(internal_user_id, new_session_name.strip())
                st.success(f"Created: {new_sess['name']}")
                st.rerun()
            else:
                st.warning("Enter a session name.")

    # List + select existing sessions
    sessions = db.list_sessions(internal_user_id)
    if not sessions:
        st.info("No sessions yet. Create one above.")
        st.stop()

    session_options = {s["name"] + f"  ({s['id'][:8]}…)": s for s in sessions}
    selected_label = st.selectbox("Active session", list(session_options.keys()))
    active_session = session_options[selected_label]
    active_session_id = active_session["id"]

    st.caption(f"Session ID: `{active_session_id}`")

    # Docs in this session
    st.divider()
    st.subheader("Documents in session")
    session_docs = db.list_documents_for_session(active_session_id)
    if session_docs:
        for doc in session_docs:
            status_icon = {"ingested": "✅", "processing": "⏳", "failed": "❌", "pending": "🕐"}.get(doc["status"], "❓")
            st.markdown(f"{status_icon} **{doc['file_name']}** — {doc['pages_ingested']} page(s)")
    else:
        st.info("No documents yet.")

# ---------------------------------------------------------------------------
# Main area — tabs
# ---------------------------------------------------------------------------
ingest_tab, query_tab, notes_tab = st.tabs(["📤 Ingest", "🔍 Query", "📋 Notes"])

# ── Ingest ──────────────────────────────────────────────────────────────────
with ingest_tab:
    st.header("Upload & Ingest Document")
    st.caption(f"Uploading into session: **{active_session['name']}**")

    uploaded_files = st.file_uploader(
        "PDF, JPEG, or PNG — select multiple files",
        type=["pdf", "jpg", "jpeg", "png"],
        accept_multiple_files=True,
    )
    ingest_btn = st.button("Ingest", disabled=not uploaded_files)

    if ingest_btn and uploaded_files:
        content_type_map = {"pdf": "application/pdf", "jpeg": "image/jpeg", "png": "image/png"}
        total_pages = 0
        errors = []

        for uploaded_file in uploaded_files:
            ext = uploaded_file.name.rsplit(".", 1)[-1].lower()
            file_type = "jpeg" if ext == "jpg" else ext
            content_type = content_type_map[file_type]
            file_bytes = uploaded_file.read()
            document_id = None

            with st.status(f"Processing **{uploaded_file.name}**…", expanded=True) as status:
                try:
                    storage_path = db.upload_file(
                        file_bytes=file_bytes,
                        file_name=uploaded_file.name,
                        content_type=content_type,
                        user_id=internal_user_id,
                        session_id=active_session_id,
                    )
                    st.write(f"✅ Uploaded to storage")

                    doc_record = db.create_document_record(
                        user_id=internal_user_id,
                        session_id=active_session_id,
                        file_name=uploaded_file.name,
                        file_type=file_type,
                        storage_path=storage_path,
                    )
                    document_id = doc_record["id"]
                    st.write(f"✅ DB record created")

                    st.write("🧠 Embedding into vector store…")
                    db.update_document_status(document_id, "processing")
                    count = pipeline.ingest(
                        file_bytes=file_bytes,
                        document_id=document_id,
                        file_type=file_type,
                        user_id=internal_user_id,
                        session_id=active_session_id,
                    )
                    db.update_document_status(document_id, "ingested", count)
                    total_pages += count
                    st.write(f"✅ {count} page(s) ingested")
                    status.update(label=f"✅ {uploaded_file.name} — done", state="complete")

                except Exception as exc:
                    if document_id:
                        db.update_document_status(document_id, "failed")
                    errors.append(uploaded_file.name)
                    status.update(label=f"❌ {uploaded_file.name} — failed", state="error")
                    st.error(str(exc))

        if errors:
            st.warning(f"Failed: {', '.join(errors)}")
        else:
            st.success(f"All {len(uploaded_files)} file(s) ingested — {total_pages} total page(s).")
        st.rerun()

# ── Query ────────────────────────────────────────────────────────────────────
with query_tab:
    st.header("Query Session")
    st.caption(f"Searching session: **{active_session['name']}**")

    if not session_docs:
        st.info("Ingest at least one document into this session before querying.")
    else:
        query_text = st.text_input("Ask a question about your documents")
        limit = st.slider("Pages to retrieve", 1, 10, 3)
        submit_btn = st.button("Submit", disabled=not query_text.strip())

        if submit_btn and query_text.strip():
            try:
                with st.spinner("Querying…"):
                    result = pipeline.query(query_text.strip(), limit=limit, session_id=active_session_id)

                st.subheader("Answer")
                answer = result.get("answer", "")
                st.write(answer if answer else "_No answer generated._")

                pages = result.get("pages", [])
                image_pages = [p for p in pages if p.get("document_type") != "transcript"]
                if image_pages:
                    st.subheader("Retrieved Pages")
                    cols = st.columns(len(image_pages))
                    for col, page in zip(cols, image_pages):
                        image_b64 = page.get("image_b64", "")
                        page_num = page.get("page_number", "?")
                        doc_id = page.get("document_id", "")
                        if image_b64:
                            try:
                                col.image(
                                    base64.b64decode(image_b64),
                                    caption=f"doc {doc_id[:8]}… — p.{page_num}",
                                    use_container_width=True,
                                )
                            except Exception:
                                pass
            except Exception as exc:
                st.error(f"Query failed: {exc}")

# ── Notes ────────────────────────────────────────────────────────────────────
with notes_tab:
    st.header("Clinical Notes")
    st.caption(f"Session: **{active_session['name']}**")

    RECORDINGS_DIR = Path("data/recordings")
    RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Record or upload ──────────────────────────────────────────────────────
    rec_col, upload_col = st.columns(2)

    with rec_col:
        st.subheader("🎙️ Record")
        st.caption("Click the mic to start/stop recording.")
        recorded_bytes = audio_recorder(
            text="",
            recording_color="#e8534a",
            neutral_color="#6aa36f",
            icon_size="2x",
            pause_threshold=3.0,
        )

    with upload_col:
        st.subheader("📁 Upload")
        uploaded_audio = st.file_uploader(
            "mp3, wav, ogg, webm, m4a",
            type=["mp3", "wav", "ogg", "webm", "m4a"],
            label_visibility="collapsed",
        )

    # Resolve which audio source to use (record takes priority if both present)
    audio_bytes: bytes | None = None
    audio_filename: str | None = None
    audio_mime: str = "audio/wav"       # used for Supabase upload (normalised inside upload_audio)
    gemini_mime: str = "audio/wav"      # used for Gemini transcription — must be audio/wav not audio/wave

    if recorded_bytes:
        audio_bytes = recorded_bytes
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_filename = f"recording_{ts}.wav"
        audio_mime = "audio/wav"
        gemini_mime = "audio/wav"
        st.audio(audio_bytes, format="audio/wav")
    elif uploaded_audio is not None:
        audio_bytes = uploaded_audio.read()
        audio_filename = uploaded_audio.name
        audio_mime = uploaded_audio.type or "audio/mpeg"
        # normalise wav variants for Gemini
        gemini_mime = "audio/wav" if audio_mime in ("audio/wave", "audio/x-wav") else audio_mime
        st.audio(audio_bytes, format=audio_mime)

    transcribe_btn = st.button("Transcribe & Ingest", disabled=audio_bytes is None)

    if transcribe_btn and audio_bytes and audio_filename:
        # 1. Save locally to data/recordings/
        local_path = RECORDINGS_DIR / audio_filename
        local_path.write_bytes(audio_bytes)

        with st.status("Processing audio…", expanded=True) as status:
            try:
                # 2. Upload to Supabase storage
                st.write("☁️ Uploading to storage…")
                storage_path = db.upload_audio(
                    file_bytes=audio_bytes,
                    file_name=audio_filename,
                    mime_type=audio_mime,
                    user_id=internal_user_id,
                    session_id=active_session_id,
                )

                # 3. Transcribe with speaker diarization
                st.write("🧠 Transcribing with speaker diarization…")
                transcript = NoteTaker().transcribe(audio_bytes, gemini_mime)

                # 4. Save note to Supabase DB
                st.write("💾 Saving note…")
                note_record = db.save_note(
                    internal_user_id, active_session_id, storage_path, transcript
                )

                # 5. Ingest transcript into RAG pipeline
                st.write("📥 Ingesting transcript into RAG…")
                pipeline.ingest_transcript(
                    transcript=transcript,
                    document_id=note_record["id"],
                    user_id=internal_user_id,
                    session_id=active_session_id,
                )

                status.update(label="✅ Done", state="complete")
                st.success(f"Saved locally to `{local_path}` and ingested into RAG.")
                st.rerun()

            except Exception as exc:
                status.update(label="❌ Failed", state="error")
                st.error(f"Processing failed: {exc}")

    st.divider()
    st.subheader("Past Notes")
    notes = db.list_notes(active_session_id)
    if not notes:
        st.info("No notes yet for this session.")
    else:
        for note in notes:
            with st.expander(f"Note — {note['created_at']}"):
                try:
                    audio_url = db.get_audio_url(note["audio_path"])
                    st.audio(audio_url)
                except Exception:
                    st.caption("_(audio unavailable)_")
                st.markdown(f"**Summary:** {note['summary']}")
                st.divider()
                for seg in note["segments"]:
                    st.markdown(f"**[{seg['timestamp']}] {seg['speaker']}:** {seg['text']}")

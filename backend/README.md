# Multimodal RAG — Clinical Document Assistant

A full-stack application that lets clinicians upload documents and audio recordings, then query them with natural language. Documents and transcripts are embedded into a vector store and answered by a multimodal LLM.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Clients
        UI["Streamlit UI\n(app.py)"]
        REST["REST Client\n(HTTP)"]
    end

    subgraph FastAPI["FastAPI Backend (api/)"]
        direction TB
        MAIN["main.py\napp entrypoint"]
        R_HEALTH["/health"]
        R_SESSIONS["/sessions"]
        R_INGEST["/ingest"]
        R_QUERY["/query"]
        R_NOTES["/notes\n(upload / transcribe / list)"]
        DEP["dependencies.py\nget_pipeline() — singleton"]
    end

    subgraph Pipeline["RAG Pipeline (src/rag/)"]
        PM["PipelineManager\norchestrates all steps"]
        FP["FileProcessor\npdf2image / Pillow\n→ list[PageData]"]
        EMB["Embedder\ngemini-embedding-2-preview\nRETRIEVAL_DOCUMENT / RETRIEVAL_QUERY"]
        WS["WeaviateStore\nClinicDocuments collection\nself-provided vectors"]
    end

    subgraph Notes["Notes Pipeline (src/notes/)"]
        NT["NoteTaker\ngemini-2.5-flash\nspeaker diarization → JSON"]
        SS["supabase_store.py\nusers / sessions / documents / notes / audio"]
    end

    subgraph External["External Services"]
        GEM["Google Gemini API\nembedding + generation"]
        WEA["Weaviate Cloud\nvector database"]
        SUP["Supabase\nPostgres DB + Storage bucket"]
    end

    %% Client → API
    UI -->|HTTP| MAIN
    REST -->|HTTP| MAIN
    MAIN --> R_HEALTH & R_SESSIONS & R_INGEST & R_QUERY & R_NOTES
    R_INGEST & R_QUERY & R_NOTES --> DEP
    DEP -->|singleton| PM

    %% Ingest flow
    R_INGEST -->|file bytes| PM
    PM --> FP
    FP -->|list[PageData]\nbase64 JPEG| PM
    PM --> EMB
    EMB -->|embed_document\nimage bytes → float[]| GEM
    GEM -->|vector| EMB
    EMB --> WS
    WS -->|batch insert\nwith vector| WEA

    %% Query flow
    R_QUERY -->|text + session_id| PM
    PM --> EMB
    EMB -->|embed_query\ntext → float[]| GEM
    GEM -->|vector| EMB
    EMB --> WS
    WS -->|near_vector search\nfiltered by session_id| WEA
    WEA -->|top-k pages\nbase64 images| WS
    WS -->|images + query| GEM
    GEM -->|generated answer| WS
    WS -->|answer + pages| R_QUERY

    %% Notes / audio flow
    R_NOTES -->|audio bytes| NT
    NT -->|audio + prompt| GEM
    GEM -->|JSON transcript\nsummary + segments| NT
    NT -->|TranscriptResult| R_NOTES
    R_NOTES -->|ingest_transcript| PM
    PM -->|embed text chunk| EMB
    R_NOTES --> SS
    SS -->|upload audio\nsave note row| SUP

    %% Session / document metadata
    R_SESSIONS & R_INGEST --> SS
    SS -->|CRUD| SUP
```

---

## Data Flows

### Document Ingestion

```
Client uploads PDF / JPEG / PNG
  → POST /ingest (multipart: files, user_id, session_id)
  → supabase_store: upload file to Storage bucket, create documents row (status=pending)
  → PipelineManager.ingest()
      → FileProcessor.process()
          PDF  → pdf2image (150 dpi) → list of PIL Images → base64 JPEG
          JPEG/PNG → Pillow verify + convert → base64 JPEG
      → WeaviateStore.ingest(pages)
          → Embedder.embed_document(image_bytes) → Gemini RETRIEVAL_DOCUMENT vector
          → Weaviate batch insert (doc_page BLOB, document_id, page_number, user_id, session_id, vector)
  → supabase_store: update documents row (status=ingested, pages_ingested=N)
```

### Natural Language Query

```
Client sends question
  → POST /query { text, session_id, limit }
  → PipelineManager.query()
      → WeaviateStore.query()
          → Embedder.embed_query(text) → Gemini RETRIEVAL_QUERY vector
          → Weaviate near_vector search filtered by session_id → top-k PageData objects
          → _generate_answer(): send retrieved page images + query to gemini-2.5-flash
  → Response: { answer, session_id, pages[] }
```

### Audio Note Transcription

```
Client uploads audio (mp3 / wav / ogg / webm / m4a)
  → POST /notes/upload  → Supabase Storage → returns storage_path + signed URL
  → POST /notes/transcribe { storage_path, user_id, session_id, mime_type }
      → download audio bytes from Supabase Storage
      → NoteTaker.transcribe()
          → gemini-2.5-flash with structured JSON schema
          → returns { summary, segments: [{ timestamp, speaker, text }] }
      → supabase_store.save_note() → notes table row
      → PipelineManager.ingest_transcript()
          → flatten transcript to text chunk
          → Embedder.embed_query(text) → vector
          → WeaviateStore.ingest_text() → Weaviate (document_type="transcript")
  → Response: NoteResponse with note_id, summary, segments, audio_url
```

---

## Project Structure

```
.
├── api/                        # FastAPI application
│   ├── main.py                 # App factory, router registration
│   ├── dependencies.py         # Singleton PipelineManager via lru_cache
│   └── routers/
│       ├── health.py           # GET  /health
│       ├── sessions.py         # POST /sessions, GET /sessions/{id}
│       ├── ingest.py           # POST /ingest  (multipart)
│       ├── query.py            # POST /query
│       └── notes.py            # POST /notes/upload, /notes/transcribe, GET /notes/{session_id}
│
├── src/
│   ├── rag/
│   │   ├── pipeline_manager.py # Orchestrator: FileProcessor + Embedder + WeaviateStore
│   │   ├── file_processor.py   # PDF/image → list[PageData] (base64 JPEG)
│   │   ├── embedder.py         # Gemini embedding-2-preview wrapper
│   │   └── weaviate_store.py   # Weaviate CRUD + multimodal answer generation
│   └── notes/
│       ├── note_taker.py       # Audio transcription with speaker diarization (Gemini)
│       └── supabase_store.py   # All Supabase DB + Storage operations
│
├── app.py                      # Streamlit UI (Ingest / Query / Notes tabs)
├── supabase/migrations/        # SQL schema (users, sessions, documents, notes)
└── pyproject.toml
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Weaviate connectivity check |
| `POST` | `/sessions` | Create a new session |
| `GET` | `/sessions/user/{user_id}` | List all sessions for a user |
| `GET` | `/sessions/{session_id}` | Get session details |
| `GET` | `/sessions/{session_id}/documents` | List documents in a session |
| `POST` | `/ingest` | Upload and ingest documents (multipart) |
| `POST` | `/query` | Natural language query over a session |
| `POST` | `/notes/upload` | Upload audio to Supabase Storage |
| `POST` | `/notes/transcribe` | Transcribe audio and ingest into RAG |
| `GET` | `/notes/{session_id}` | List notes for a session |

Interactive docs available at `http://localhost:8000/docs` when the server is running.

---

## Database Schema

Managed via Supabase Postgres. Migrations live in `supabase/migrations/`.

```
users        id (UUID PK), external_id (TEXT UNIQUE), created_at
sessions     id (UUID PK), user_id (FK → users), name, created_at, updated_at
documents    id (UUID PK), user_id (FK), session_id (FK), file_name, file_type,
             storage_path, status (pending|processing|ingested|failed), pages_ingested
notes        id (UUID PK), user_id (FK), session_id (FK), audio_path,
             summary (TEXT), segments (JSONB), created_at
```

Supabase Storage bucket `documents` holds both uploaded files and audio recordings, organized as `{user_id}/{session_id}/{uuid}.{ext}`.

---

## Weaviate Collection

Collection name: `ClinicDocuments`

| Property | Type | Description |
|----------|------|-------------|
| `doc_page` | BLOB | Base64-encoded JPEG (or base64-encoded text for transcripts) |
| `document_id` | TEXT | References the Supabase `documents.id` or `notes.id` |
| `page_number` | INT | 1-based page index (0 for transcript chunks) |
| `document_type` | TEXT | `pdf_page`, `jpeg_image`, `png_image`, or `transcript` |
| `user_id` | TEXT | Supabase user UUID |
| `session_id` | TEXT | Supabase session UUID |
| `doc_vector` | vector | Self-provided via Gemini embedding-2-preview |

Queries use `near_vector` search filtered by `session_id` to scope results to the active session.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Streamlit |
| Backend API | FastAPI + Uvicorn |
| Embedding | Google Gemini `gemini-embedding-2-preview` |
| Generation | Google Gemini `gemini-2.5-flash` |
| Vector DB | Weaviate Cloud |
| Relational DB | Supabase (Postgres) |
| File Storage | Supabase Storage |
| Runtime | Python 3.12+, uv |

---

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:

```env
WEAVIATE_URL=your_weaviate_cluster_url
WEAVIATE_API_KEY=your_weaviate_api_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

2. Install dependencies:

```bash
uv sync
```

3. Apply database migrations via the Supabase dashboard or CLI.

4. Run the FastAPI backend:

```bash
uvicorn api.main:app --reload
```

5. Run the Streamlit UI (optional):

```bash
streamlit run app.py
```

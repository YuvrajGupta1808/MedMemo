from src.rag.embedder import Embedder
from src.rag.file_processor import FileProcessor
from src.rag.weaviate_store import WeaviateStore


class PipelineManager:
    """Orchestrates FileProcessor, Embedder, and WeaviateStore for document ingestion and querying."""

    def __init__(self) -> None:
        self.file_processor = FileProcessor()
        self.embedder = Embedder()
        self.weaviate_store = WeaviateStore(self.embedder)

    def ingest(self, file_bytes: bytes, document_id: str, file_type: str,
               user_id: str = "", session_id: str = "") -> int:
        """Process a file and ingest its pages into Weaviate.

        Args:
            file_bytes: Raw file content.
            document_id: Identifier to associate with each page.
            file_type: One of "pdf", "jpeg", or "png".
            user_id: User identifier to tag pages with.
            session_id: Session identifier to tag pages with.

        Returns:
            Count of successfully inserted pages.
        """
        pages = self.file_processor.process(file_bytes, document_id, file_type)
        for page in pages:
            page["user_id"] = user_id
            page["session_id"] = session_id
        return self.weaviate_store.ingest(pages)

    def ingest_transcript(self, transcript: dict, document_id: str, user_id: str = "", session_id: str = "") -> None:
        """Embed and store a transcript's full text into Weaviate for RAG queries.

        Combines the summary and all speaker segments into a single searchable chunk.

        Args:
            transcript: TranscriptResult dict with 'summary' and 'segments'.
            document_id: Identifier to tag this chunk (e.g. note_id).
            user_id: User identifier.
            session_id: Session identifier.
        """
        lines = [f"Summary: {transcript['summary']}"]
        for seg in transcript.get("segments", []):
            lines.append(f"[{seg['timestamp']}] {seg['speaker']}: {seg['text']}")
        full_text = "\n".join(lines)
        self.weaviate_store.ingest_text(full_text, document_id, user_id, session_id)

    def query(self, text: str, limit: int = 3, session_id: str | None = None) -> dict:
        """Query the ingested documents with a natural language question.

        Args:
            text: Natural language query string.
            limit: Number of pages to retrieve (default 3).
            session_id: If provided, restrict search to this session.

        Returns:
            QueryResult dict with 'answer' (str) and 'pages' (list of dicts).
        """
        return self.weaviate_store.query(text, limit, session_id)

    def delete_document(self, document_id: str) -> int:
        """Delete all Weaviate objects for a document. Returns count deleted."""
        return self.weaviate_store.delete_by_document_id(document_id)

    def delete_session_documents(self, session_id: str) -> int:
        """Delete all Weaviate objects for a session. Returns count deleted."""
        return self.weaviate_store.delete_by_session_id(session_id)

    def is_ready(self) -> bool:
        """Return whether the Weaviate client is ready."""
        return self.weaviate_store.is_ready()

import base64
import os

import weaviate
from google import genai
from google.genai import types
from weaviate.classes.config import Configure, DataType, Property
from weaviate.classes.init import Auth
from weaviate.classes.query import Filter

from src.rag.embedder import Embedder


COLLECTION_NAME = "ClinicDocuments"


class WeaviateStore:
    """Wraps the Weaviate Cloud client for clinic document ingestion and multimodal RAG queries."""

    def __init__(self, embedder: Embedder) -> None:
        """Connect to Weaviate Cloud using env vars and ensure the collection exists.

        Args:
            embedder: Embedder instance used for document and query embedding.
        """
        self._embedder = embedder

        url = os.environ["WEAVIATE_URL"]
        api_key = os.environ["WEAVIATE_API_KEY"]

        self.client = weaviate.connect_to_weaviate_cloud(
            cluster_url=url,
            auth_credentials=Auth.api_key(api_key),
        )

        self._genai_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        self._ensure_collection()

    def _ensure_collection(self) -> None:
        """Create the ClinicDocuments collection if it does not already exist."""
        if self.client.collections.exists(COLLECTION_NAME):
            self.collection = self.client.collections.get(COLLECTION_NAME)
            return

        self.collection = self.client.collections.create(
            name=COLLECTION_NAME,
            properties=[
                Property(name="doc_page", data_type=DataType.BLOB),
                Property(name="document_id", data_type=DataType.TEXT),
                Property(name="page_number", data_type=DataType.INT),
                Property(name="document_type", data_type=DataType.TEXT),
                Property(name="user_id", data_type=DataType.TEXT),
                Property(name="session_id", data_type=DataType.TEXT),
            ],
            vector_config=Configure.Vectors.self_provided(name="doc_vector"),
        )

    def ingest_text(self, text: str, document_id: str, user_id: str = "", session_id: str = "") -> bool:
        """Embed a plain-text chunk and insert it into Weaviate.

        Used for ingesting transcripts so they are queryable via RAG.

        Args:
            text: The text content to embed and store.
            document_id: Identifier to associate with this chunk.
            user_id: User identifier.
            session_id: Session identifier.

        Returns:
            True if inserted successfully.
        """
        vector = self._embedder.embed_query(text)
        # BLOB field requires valid base64 — encode the transcript text itself
        text_b64 = base64.b64encode(text.encode()).decode()
        self.collection.data.insert(
            properties={
                "doc_page": text_b64,
                "document_id": document_id,
                "page_number": 0,
                "document_type": "transcript",
                "user_id": user_id,
                "session_id": session_id,
            },
            vector={"doc_vector": vector},
        )
        return True

    def ingest(self, pages: list[dict]) -> int:
        """Batch-insert page dicts into Weaviate with pre-computed embeddings.

        Args:
            pages: List of PageData dicts with document_id, page_number, image_b64,
                   mime_type, document_type, user_id, and session_id.

        Returns:
            Count of successfully inserted objects.
        """
        with self.collection.batch.dynamic() as batch:
            for page in pages:
                image_bytes = base64.b64decode(page["image_b64"])
                vector = self._embedder.embed_document(image_bytes, page["mime_type"])
                batch.add_object(
                    properties={
                        "doc_page": page["image_b64"],
                        "document_id": page["document_id"],
                        "page_number": page["page_number"],
                        "document_type": page["document_type"],
                        "user_id": page.get("user_id", ""),
                        "session_id": page.get("session_id", ""),
                    },
                    vector={"doc_vector": vector},
                )

        failed = len(self.collection.batch.failed_objects)
        return len(pages) - failed

    def query(self, text: str, limit: int = 3, session_id: str | None = None) -> dict:
        """Perform a near_vector search and generate an answer from retrieved pages.

        Args:
            text: Natural language query string.
            limit: Number of pages to retrieve (default 3).
            session_id: If provided, restrict search to pages from this session.

        Returns:
            QueryResult dict with 'answer' (str) and 'pages' (list of dicts with
            document_id, page_number, session_id, and image_b64).
        """
        query_vector = self._embedder.embed_query(text)

        filters = Filter.by_property("session_id").equal(session_id) if session_id else None

        response = self.collection.query.near_vector(
            near_vector=query_vector,
            target_vector="doc_vector",
            limit=limit,
            filters=filters,
            return_properties=["doc_page", "document_id", "page_number", "session_id", "document_type"],
        )

        pages = [
            {
                "document_id": obj.properties.get("document_id"),
                "page_number": obj.properties.get("page_number"),
                "session_id": obj.properties.get("session_id"),
                "document_type": obj.properties.get("document_type", ""),
                "image_b64": obj.properties.get("doc_page", ""),
            }
            for obj in response.objects
        ]

        answer = self._generate_answer(pages, text)
        return {"answer": answer, "pages": pages}

    def _generate_answer(self, pages: list[dict], query: str) -> str:
        """Send retrieved page images/transcripts and query to gemini-2.5-flash and return the answer."""
        try:
            contents = []
            for page in pages:
                doc_type = page.get("document_type", "")
                image_b64 = page.get("image_b64", "")

                if doc_type == "transcript":
                    # stored as base64-encoded text — decode back to plain text
                    try:
                        contents.append(base64.b64decode(image_b64).decode("utf-8"))
                    except Exception:
                        pass
                elif image_b64:
                    # validate it's a real image by checking decoded size (images are large, text is small)
                    try:
                        raw = base64.b64decode(image_b64)
                        # JPEG magic bytes: FF D8 FF — skip anything that isn't an image
                        if raw[:3] == b"\xff\xd8\xff" or raw[:4] == b"\x89PNG":
                            contents.append(
                                types.Part.from_bytes(data=raw, mime_type="image/jpeg")
                            )
                    except Exception:
                        pass

            # always append the query text last
            contents.append(query)

            response = self._genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
            )
            return response.text or ""
        except Exception as exc:
            raise RuntimeError(f"WeaviateStore._generate_answer failed: {exc}") from exc

    def delete_by_document_id(self, document_id: str) -> int:
        """Delete all Weaviate objects matching document_id. Returns count deleted."""
        try:
            result = self.collection.data.delete_many(
                where=Filter.by_property("document_id").equal(document_id)
            )
            return result.successful if hasattr(result, "successful") else 0
        except Exception:
            return 0

    def delete_by_session_id(self, session_id: str) -> int:
        """Delete all Weaviate objects matching session_id. Returns count deleted."""
        try:
            result = self.collection.data.delete_many(
                where=Filter.by_property("session_id").equal(session_id)
            )
            return result.successful if hasattr(result, "successful") else 0
        except Exception:
            return 0

    def is_ready(self) -> bool:
        """Return whether the Weaviate client is ready."""
        return self.client.is_ready()

    def close(self) -> None:
        """Close the Weaviate client connection."""
        self.client.close()

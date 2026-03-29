import os

from google import genai
from google.genai import types


class Embedder:
    def __init__(self) -> None:
        self._client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    def embed_document(self, image_bytes: bytes, mime_type: str) -> list[float]:
        """Embed a page image for storage (RETRIEVAL_DOCUMENT)."""
        try:
            result = self._client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            return list(result.embeddings[0].values)
        except Exception as exc:
            raise RuntimeError(f"Embedder.embed_document failed: {exc}") from exc

    def embed_query(self, text: str) -> list[float]:
        """Embed a natural-language query (RETRIEVAL_QUERY)."""
        try:
            result = self._client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            return list(result.embeddings[0].values)
        except Exception as exc:
            raise RuntimeError(f"Embedder.embed_query failed: {exc}") from exc

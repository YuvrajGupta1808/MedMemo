"""Note-taking pipeline: transcribes audio with speaker diarization using Gemini."""
import json
import os
from typing import TypedDict

from google import genai
from google.genai import types


class TranscriptSegment(TypedDict):
    timestamp: str   # "MM:SS"
    speaker: str
    text: str


class TranscriptResult(TypedDict):
    summary: str
    segments: list[TranscriptSegment]


TRANSCRIPTION_PROMPT = """
You are a medical note-taking assistant. Transcribe this clinical audio recording.

Requirements:
1. Identify each distinct speaker (label them as "Doctor", "Patient", or "Speaker 1", "Speaker 2" etc. if roles are unclear).
2. Provide a timestamp (MM:SS) for each speaker segment.
3. Transcribe the speech accurately, preserving medical terminology.
4. Provide a brief clinical summary at the end.

Return structured JSON only.
"""


class NoteTaker:
    """Transcribes audio recordings with speaker diarization via Gemini."""

    def __init__(self) -> None:
        self._client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    def transcribe(self, audio_bytes: bytes, mime_type: str) -> TranscriptResult:
        """Transcribe audio and return speaker-segmented transcript.

        Args:
            audio_bytes: Raw audio file content.
            mime_type: Audio MIME type e.g. "audio/mp3", "audio/wav".

        Returns:
            Dict with 'summary' (str) and 'segments' (list of dicts with
            timestamp, speaker, text).

        Raises:
            RuntimeError: If the Gemini call fails or returns invalid JSON.
        """
        try:
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    TRANSCRIPTION_PROMPT,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "summary": types.Schema(
                                type=types.Type.STRING,
                                description="Brief clinical summary of the recording.",
                            ),
                            "segments": types.Schema(
                                type=types.Type.ARRAY,
                                description="Speaker-segmented transcript.",
                                items=types.Schema(
                                    type=types.Type.OBJECT,
                                    properties={
                                        "timestamp": types.Schema(type=types.Type.STRING),
                                        "speaker": types.Schema(type=types.Type.STRING),
                                        "text": types.Schema(type=types.Type.STRING),
                                    },
                                    required=["timestamp", "speaker", "text"],
                                ),
                            ),
                        },
                        required=["summary", "segments"],
                    ),
                ),
            )
            return json.loads(response.text)
        except Exception as exc:
            raise RuntimeError(f"NoteTaker.transcribe failed: {exc}") from exc

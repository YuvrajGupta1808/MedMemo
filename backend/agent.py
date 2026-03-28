import sys
import railtracks as rt
from dotenv import load_dotenv
load_dotenv()

from src.agents.tools import (
    create_patient_session,
    list_patient_sessions,
    ingest_document,
    query_patient_documents,
    transcribe_clinical_audio,
    list_session_documents,
    list_session_notes,
)

# LLM — reuses GEMINI_API_KEY from .env
model = rt.llm.GeminiLLM("gemini-2.5-flash")

# MedNemo Agent with all 7 tools
MedNemoAgent = rt.agent_node(
    "MedNemo Agent",
    tool_nodes=[
        create_patient_session,
        list_patient_sessions,
        ingest_document,
        query_patient_documents,
        transcribe_clinical_audio,
        list_session_documents,
        list_session_notes,
    ],
    llm=model,
    system_message="""You are MedNemo, an AI medical assistant for doctors.
You help manage patient sessions, ingest medical documents and audio recordings,
and answer clinical questions using RAG (retrieval-augmented generation).

Capabilities:
- Create and list patient sessions
- Ingest PDF, JPEG, PNG medical documents into the current session  
- Transcribe clinical audio recordings with speaker diarization
- Query ingested documents to answer clinical questions
- List documents and audio notes in the current session

Always confirm which patient session is active before ingesting or querying.
The user_id and session_id are already set in your context — you do not need to ask for them.
""",
)

# Chat entry point — opens local browser chat UI
@rt.function_node
async def mednemo_chat():
    """Start an interactive chat session with MedNemo in the browser."""
    response = await rt.interactive.local_chat(MedNemoAgent)
    if response is None:
        return "Session ended."
    return response


if __name__ == "__main__":
    # Usage: python agent.py <user_id> [session_id]
    user_id = sys.argv[1] if len(sys.argv) > 1 else "demo-user"
    session_id = sys.argv[2] if len(sys.argv) > 2 else ""

    print(f"🏥 Starting MedNemo for user: {user_id}")
    print("💬 A browser window will open with the chat interface...")

    rt.Flow(
        name="MedNemo Interactive",
        entry_point=mednemo_chat,
        context={"user_id": user_id, "session_id": session_id},
        save_state=True,
    ).invoke()

    print("✅ Session ended.")

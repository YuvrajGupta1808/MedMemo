import logging
import os
import sys

import railtracks as rt
from dotenv import load_dotenv

logger = logging.getLogger("RT.mednemo.global")

load_dotenv()

from railtracks.human_in_the_loop.local_chat_ui import ChatUI
from railtracks.human_in_the_loop import HILMessage
from railtracks.llm.message import UserMessage, AssistantMessage
from railtracks.llm.history import MessageHistory
from railtracks.interaction._call import call

from src.agents.tools import (
    create_patient_session,
    list_patient_sessions,
    get_session_details,
    delete_session,
    switch_session,
    ingest_document,
    delete_document,
    query_patient_documents,
    transcribe_clinical_audio,
    list_session_documents,
    list_session_notes,
)

model = rt.llm.GeminiLLM("gemini-2.5-flash")

GlobalMedNemoAgent = rt.agent_node(
    "MedNemo Global Agent",
    tool_nodes=[
        create_patient_session,
        list_patient_sessions,
        get_session_details,
        delete_session,
        switch_session,
        ingest_document,
        delete_document,
        query_patient_documents,
        transcribe_clinical_audio,
        list_session_documents,
        list_session_notes,
    ],
    llm=model,
    system_message="""You are MedNemo, a full-featured AI medical assistant for doctors.
You manage patient sessions, ingest medical documents, transcribe audio, and answer clinical questions.

Capabilities:
1. **Session Management**: Create, list, switch, get details, and delete patient sessions
2. **Document Ingestion**: Ingest PDF, JPEG, PNG medical documents into the active session
3. **Document Management**: List and delete documents in a session
4. **Audio Transcription**: Transcribe clinical audio recordings with speaker diarization
5. **Clinical Q&A**: Query ingested documents with clinical questions using RAG
6. **Notes**: List clinical audio notes in a session

Workflow:
- Always start by listing or creating a session. Use switch_session to change the active session.
- The active session determines which documents are searched during queries.
- When asked about a patient, ALWAYS use query_patient_documents to search their documents first.
- When the user says "go to" or "switch to" a session, use switch_session.
- When the user attaches files, inform them that file ingestion should be done via the web UI (this chat does not process file attachments directly).

Important:
- Do NOT say "I cannot provide information about individuals" — use the query tool to search documents.
- If asked about something not in the documents, say "I don't see information about that in the ingested documents for this session."
- Be conversational and helpful. Greet the doctor, confirm actions, explain findings.
- For destructive operations (delete session, delete document), always confirm with the user first before proceeding.
""",
)


@rt.function_node
async def global_mednemo_chat():
    """Start an interactive chat session with the full MedNemo agent."""
    chat_ui = ChatUI(auto_open=True)
    await chat_ui.connect()
    logger.info("Global Chat UI connected")
    await rt.broadcast("Chat UI connected")

    msg_history = MessageHistory([])
    last_tool_idx = 0

    while chat_ui.is_connected:
        try:
            message = await chat_ui.receive_message()
            if message is None:
                continue

            content = message.content or ""

            if message.attachments:
                content += "\n\n(Note: File attachments are not processed in this chat. Please use the web UI to ingest documents, or provide the file path and I can ingest it for you.)"
                logger.info(f"User attached {len(message.attachments)} file(s) — not processed in chat")

            logger.info(f"User: {content[:100]}")
            await rt.broadcast("Processing message...")

            msg_history.append(UserMessage(content=content))

            logger.info("Calling Global MedNemo agent...")
            await rt.broadcast("Thinking...")
            response = await call(GlobalMedNemoAgent, msg_history)
            logger.info(f"Agent response ({len(response.content)} chars), {len(response.tool_invocations) - last_tool_idx} tool calls")
            msg_history = response.message_history.copy()

            await chat_ui.send_message(HILMessage(content=response.content))
            await chat_ui.update_tools(response.tool_invocations[last_tool_idx:])
            last_tool_idx = len(response.tool_invocations)

        except Exception as e:
            logger.error(f"Global chat loop error: {e}", exc_info=True)
            try:
                await chat_ui.send_message(HILMessage(content=f"⚠️ An error occurred: {e}"))
            except Exception:
                pass

    logger.info("Global chat session ended")
    return "Session ended."


if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "demo-user"
    session_id = sys.argv[2] if len(sys.argv) > 2 else ""

    rt.enable_logging(level="DEBUG", log_file="mednemo_global.log")

    def broadcast_handler(data):
        logger.info(f"[broadcast] {data}")

    rt.set_config(broadcast_callback=broadcast_handler)

    logger.info(f"Starting Global MedNemo for user: {user_id}")
    print(f"🏥 Starting MedNemo (Global) for user: {user_id}")
    print("💬 A browser window will open with the chat interface...")

    rt.Flow(
        name="MedNemo Global Interactive",
        entry_point=global_mednemo_chat,
        context={"user_id": user_id, "session_id": session_id},
        save_state=True,
    ).invoke()

    logger.info("Global session ended.")
    print("✅ Session ended.")

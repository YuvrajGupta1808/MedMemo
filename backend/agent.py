import logging
import os
import sys

import railtracks as rt
from dotenv import load_dotenv

logger = logging.getLogger("RT.mednemo")

load_dotenv()

from railtracks.human_in_the_loop.local_chat_ui import ChatUI
from railtracks.human_in_the_loop import HILMessage
from railtracks.llm.message import UserMessage, AssistantMessage
from railtracks.llm.history import MessageHistory
from railtracks.interaction._call import call

from src.agents.tools import (
    query_patient_documents,
    list_patient_sessions,
    switch_session,
    get_session_details,
    list_session_documents,
)

# LLM — reuses GEMINI_API_KEY from .env
model = rt.llm.GeminiLLM("gemini-2.5-flash")

# MedNemo Agent — query only
MedNemoAgent = rt.agent_node(
    "MedNemo Agent",
    tool_nodes=[
        list_patient_sessions,
        switch_session,
        get_session_details,
        list_session_documents,
        query_patient_documents,
    ],
    llm=model,
    system_message="""You are MedNemo, an AI medical assistant for doctors.
You answer clinical questions about patients using retrieval-augmented generation (RAG) over their ingested medical documents.

Session Management:
- You can list all patient sessions, switch between them, and get session details.
- When the doctor asks to "go to" or "switch to" a session, use switch_session with the session ID.
- When the doctor mentions a patient name, use list_patient_sessions to find the right one, then switch to it automatically.
- After switching, confirm which session is now active and what documents are available using list_session_documents.
- If no session is active when the doctor asks a question, list sessions and ask which one to use.

Querying Documents:
- You have a query tool that searches the active session's ingested documents (lab reports, prescriptions, imaging results, clinical notes, transcripts).
- When the doctor asks ANY question about a patient — symptoms, history, medications, lab results, diagnoses, treatment plans — ALWAYS use query_patient_documents to search the documents first.
- Base your answers on the retrieved document content. Cite which documents/pages the information comes from.
- If the query returns no relevant results, say so honestly rather than guessing.
- You can have a natural conversation — greet the doctor, ask clarifying questions, explain medical findings in context.

Important:
- Do NOT say "I cannot provide information about individuals" — your entire purpose is to answer questions about the patient using their documents.
- If asked about something not in the documents, say "I don't see information about that in the ingested documents for this session."
- When a doctor starts the conversation, greet them and list their available sessions so they can choose one.
""",
)


@rt.function_node
async def mednemo_chat():
    """Start an interactive chat session with MedNemo in the browser."""
    chat_ui = ChatUI(auto_open=True)
    await chat_ui.connect()
    logger.info("Chat UI connected")
    await rt.broadcast("Chat UI connected")

    msg_history = MessageHistory([])
    last_tool_idx = 0

    while chat_ui.is_connected:
        try:
            message = await chat_ui.receive_message()
            if message is None:
                continue

            content = message.content or ""

            # If user attached files, inform them to use the web UI
            if message.attachments:
                content += "\n\n(Note: File attachments are not processed in this chat. Please use the web UI to ingest documents.)"
                logger.info(f"User attached {len(message.attachments)} file(s) — ignored in query-only mode")

            logger.info(f"User: {content[:100]}")
            await rt.broadcast("Processing message...")

            msg_history.append(UserMessage(content=content))

            logger.info("Calling MedNemo agent...")
            await rt.broadcast("Thinking...")
            response = await call(MedNemoAgent, msg_history)
            logger.info(f"Agent response ({len(response.content)} chars), {len(response.tool_invocations) - last_tool_idx} tool calls")
            msg_history = response.message_history.copy()

            await chat_ui.send_message(HILMessage(content=response.content))
            await chat_ui.update_tools(response.tool_invocations[last_tool_idx:])
            last_tool_idx = len(response.tool_invocations)

        except Exception as e:
            logger.error(f"Chat loop error: {e}", exc_info=True)
            try:
                await chat_ui.send_message(
                    HILMessage(content=f"⚠️ An error occurred: {e}")
                )
            except Exception:
                pass

    logger.info("Chat session ended")
    return "Session ended."


if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "demo-user"
    session_id = sys.argv[2] if len(sys.argv) > 2 else ""

    rt.enable_logging(level="DEBUG", log_file="mednemo.log")

    def broadcast_handler(data):
        logger.info(f"[broadcast] {data}")

    rt.set_config(broadcast_callback=broadcast_handler)

    logger.info(f"Starting MedNemo for user: {user_id}")
    print(f"🏥 Starting MedNemo for user: {user_id}")
    print("💬 A browser window will open with the chat interface...")

    rt.Flow(
        name="MedNemo Interactive",
        entry_point=mednemo_chat,
        context={"user_id": user_id, "session_id": session_id},
        save_state=True,
    ).invoke()

    logger.info("Session ended.")
    print("✅ Session ended.")

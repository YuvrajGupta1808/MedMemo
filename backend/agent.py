import base64
import logging
import os
import sys

import railtracks as rt
from dotenv import load_dotenv

logger = logging.getLogger("RT.mednemo")

load_dotenv()

from railtracks.human_in_the_loop.local_chat_ui import ChatUI, UserMessageAttachment
from railtracks.human_in_the_loop import HILMessage
from railtracks.llm.message import UserMessage, AssistantMessage
from railtracks.llm.history import MessageHistory
from railtracks.interaction._call import call

from src.agents.tools import (
    create_patient_session,
    list_patient_sessions,
    ingest_document,
    query_patient_documents,
    transcribe_clinical_audio,
    list_session_documents,
    list_session_notes,
)

UPLOAD_DIR = "/tmp/mednemo_uploads"

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

File Attachments:
- When users attach files, they are automatically saved to /tmp/mednemo_uploads/.
- The saved file paths will appear in the message text.
- Call ingest_document(file_path="...") for each file path listed.
- Process files one at a time. Do NOT ask the user for file paths when paths are already provided.
""",
)


@rt.function_node
async def mednemo_chat():
    """Start an interactive chat session with MedNemo in the browser."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

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

            # Save attachments to disk, collect paths
            saved_paths = []
            if message.attachments:
                for att in message.attachments:
                    if att.type == "file" and att.data:
                        fname = att.name or "upload"
                        data = att.data
                        # Strip data URI prefix if present
                        if data.startswith("data:"):
                            data = data.split(",", 1)[-1]
                        try:
                            file_bytes = base64.b64decode(data)
                            save_path = os.path.join(UPLOAD_DIR, fname)
                            with open(save_path, "wb") as f:
                                f.write(file_bytes)
                            saved_paths.append(save_path)
                            logger.info(f"Saved attachment: {save_path} ({len(file_bytes)} bytes)")
                            await rt.broadcast(f"Saved file: {fname}")
                        except Exception as e:
                            logger.error(f"Failed to save {fname}: {e}", exc_info=True)
                            saved_paths.append(f"(failed to save {fname}: {e})")

            # Build message content with file paths appended
            content = message.content or ""
            if saved_paths:
                paths_list = "\n".join(f"- {p}" for p in saved_paths)
                content += f"\n\nAttached files saved to disk:\n{paths_list}"

            logger.info(f"User: {content[:100]}")
            await rt.broadcast("Processing message...")

            # Do NOT pass attachments to UserMessage — avoids Attachment class crash for PDFs
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
            # Send error to chat but DON'T crash the session
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

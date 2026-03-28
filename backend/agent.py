import asyncio
import json
import logging
import os
import sys
from datetime import datetime

import railtracks as rt
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

logger = logging.getLogger("RT.mednemo")

load_dotenv()

from railtracks.human_in_the_loop.local_chat_ui import ChatUI
from railtracks.human_in_the_loop import HILMessage
from railtracks.llm.message import UserMessage, AssistantMessage
from railtracks.llm.history import MessageHistory
from railtracks.interaction._call import call

from src.agents.tools import query_patient_documents

# LLM — reuses GEMINI_API_KEY from .env
model = rt.llm.GeminiLLM("gemini-2.5-flash")

# MedNemo Agent — query only
MedNemoAgent = rt.agent_node(
    "MedNemo Agent",
    tool_nodes=[query_patient_documents],
    llm=model,
    system_message="""You are MedNemo, an AI medical assistant for doctors.
You answer clinical questions about the current patient session using retrieval-augmented generation (RAG) over the session's ingested medical documents.

How you work:
- You are connected to a specific patient session. All your queries search ONLY this session's documents.
- When the doctor asks ANY question about the patient — symptoms, history, medications, lab results, diagnoses, treatment plans — ALWAYS use query_patient_documents to search the documents first.
- Base your answers on the retrieved document content. Cite which documents/pages the information comes from.
- If the query returns no relevant results, say "I don't see information about that in the ingested documents for this session."
- You can have a natural conversation — greet the doctor, ask clarifying questions, explain medical findings in context.

Important:
- Do NOT say "I cannot provide information about individuals" — your entire purpose is to answer questions about this patient using their documents.
- You cannot switch sessions or manage documents. You are a focused clinical Q&A assistant for the current session only.
- When the doctor starts the conversation, greet them and let them know you're ready to answer questions about the patient's documents.
""",
)


@rt.function_node
async def mednemo_chat():
    """Start an interactive chat session with MedNemo in the browser."""
    chat_ui = ChatUI(port=7002, auto_open=False)
    chat_ui.app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Broadcast SSE: support multiple consumers
    _sse_subscribers: list[asyncio.Queue] = []

    async def _broadcast(message: dict):
        """Send message to ALL SSE subscribers."""
        dead = []
        for q in _sse_subscribers:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            _sse_subscribers.remove(q)

    # Monkey-patch the original sse_queue.put to also broadcast
    _original_sse_put = chat_ui.sse_queue.put

    async def _patched_sse_put(message):
        await _broadcast(message)
        # Also put in original queue for any internal consumers
        try:
            chat_ui.sse_queue.put_nowait(message)
        except asyncio.QueueFull:
            pass

    chat_ui.sse_queue.put = _patched_sse_put

    # Override the /events endpoint to use per-connection queues
    @chat_ui.app.get("/events")
    async def broadcast_events():
        """SSE endpoint with per-connection queue (supports multiple consumers)."""
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        _sse_subscribers.append(q)

        async def event_generator():
            try:
                while chat_ui.is_connected:
                    try:
                        message = await asyncio.wait_for(q.get(), timeout=2.0)
                        yield f"data: {json.dumps(message)}\n\n"
                    except asyncio.TimeoutError:
                        heartbeat = {
                            "type": "heartbeat",
                            "timestamp": datetime.now().isoformat(),
                        }
                        yield f"data: {json.dumps(heartbeat)}\n\n"
                    except asyncio.CancelledError:
                        break
            finally:
                if q in _sse_subscribers:
                    _sse_subscribers.remove(q)

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

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
    if len(sys.argv) < 3:
        print("Usage: python agent.py <user_id> <session_id>")
        print("Example: python agent.py dr.sarah e6a3835d-fecd-4814-a9d4-347c1c034643")
        sys.exit(1)
    user_id = sys.argv[1]
    session_id = sys.argv[2]

    rt.enable_logging(level="DEBUG", log_file="mednemo.log")

    def broadcast_handler(data):
        logger.info(f"[broadcast] {data}")

    rt.set_config(broadcast_callback=broadcast_handler)

    logger.info(f"Starting MedNemo for user: {user_id}, session: {session_id}")
    print(f"🏥 Starting MedNemo for user: {user_id}, session: {session_id}")
    print("💬 A browser window will open with the chat interface...")

    rt.Flow(
        name="MedNemo Interactive",
        entry_point=mednemo_chat,
        context={"user_id": user_id, "session_id": session_id},
        save_state=True,
    ).invoke()

    logger.info("Session ended.")
    print("✅ Session ended.")

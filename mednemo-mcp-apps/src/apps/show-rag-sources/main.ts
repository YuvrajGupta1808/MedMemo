// Show RAG Sources App — placeholder entry point
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const query = params.get("query");

console.log("[show_rag_sources] Loaded", { sessionId, query });

// TODO: Fetch RAG results from FastAPI POST /query and render chunks

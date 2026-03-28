// View Document App — placeholder entry point
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const documentId = params.get("document_id");

console.log("[view_document] Loaded", { sessionId, documentId });

// TODO: Fetch document from FastAPI and render PDF/image viewer

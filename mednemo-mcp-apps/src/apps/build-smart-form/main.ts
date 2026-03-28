// Build Smart Form App — placeholder entry point
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const formType = params.get("form_type");

console.log("[build_smart_form] Loaded", { sessionId, formType });

// TODO: Fetch form data from FastAPI POST /forms/generate and render editable form

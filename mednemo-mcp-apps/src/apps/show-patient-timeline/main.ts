// Show Patient Timeline App — placeholder entry point
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");

console.log("[show_patient_timeline] Loaded", { sessionId });

// TODO: Fetch timeline events from FastAPI and render interactive timeline

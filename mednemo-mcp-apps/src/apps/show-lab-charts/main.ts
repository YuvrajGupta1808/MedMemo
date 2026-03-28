// Show Lab Charts App — placeholder entry point
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const labType = params.get("lab_type");

console.log("[show_lab_charts] Loaded", { sessionId, labType });

// TODO: Fetch structured lab data from FastAPI and render Chart.js line charts

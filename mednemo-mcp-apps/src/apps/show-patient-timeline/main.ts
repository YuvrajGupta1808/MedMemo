// Show Patient Timeline App — interactive vertical timeline
interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  summary: string;
  color: string;
}

interface TimelineData {
  session_id: string;
  events: TimelineEvent[];
}

const TYPE_META: Record<string, { label: string; color: string; bgLight: string }> = {
  document_ingested: { label: "Document", color: "#2563eb", bgLight: "#dbeafe" },
  note_created:      { label: "Note",     color: "#16a34a", bgLight: "#dcfce7" },
  session_created:   { label: "Session",  color: "#7c3aed", bgLight: "#ede9fe" },
};

const activeFilters = new Set<string>(Object.keys(TYPE_META));

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(iso: string): string {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function renderFilters(): void {
  const container = document.getElementById("filters")!;
  container.innerHTML = "";
  for (const [type, meta] of Object.entries(TYPE_META)) {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${activeFilters.has(type) ? "active" : "inactive"}`;
    btn.style.color = meta.color;
    btn.innerHTML = `<span class="dot" style="background:${meta.color}"></span>${meta.label}`;
    btn.addEventListener("click", () => {
      if (activeFilters.has(type)) activeFilters.delete(type);
      else activeFilters.add(type);
      renderFilters();
      renderTimeline(lastData);
    });
    container.appendChild(btn);
  }
}

let lastData: TimelineData = { session_id: "", events: [] };

function renderTimeline(data: TimelineData): void {
  lastData = data;
  const tl = document.getElementById("timeline")!;
  const badge = document.getElementById("countBadge")!;
  tl.innerHTML = "";

  const filtered = data.events.filter((e) => activeFilters.has(e.type));
  badge.textContent = `${filtered.length} event${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    tl.innerHTML = `<div class="empty-state"><div class="icon">📅</div><h2>No events</h2><p>No timeline events match the current filters.</p></div>`;
    return;
  }

  for (const evt of filtered) {
    const meta = TYPE_META[evt.type] ?? { label: evt.type, color: evt.color || "#6b7280", bgLight: "#f1f5f9" };
    const item = document.createElement("div");
    item.className = "tl-item";
    item.innerHTML = `
      <div class="tl-dot"><span class="inner" style="background:${meta.color}"></span></div>
      <div class="tl-card">
        <div class="tl-card-header">
          <div class="tl-date">${escapeHtml(formatDate(evt.date))}</div>
          <div class="tl-title">${escapeHtml(evt.title)}</div>
          <span class="tl-type-badge" style="background:${meta.bgLight};color:${meta.color}">${escapeHtml(meta.label)}</span>
        </div>
        <div class="tl-expand-hint">Click to expand</div>
        <div class="tl-details">${escapeHtml(evt.summary)}</div>
      </div>`;
    item.querySelector(".tl-card")!.addEventListener("click", () => {
      item.classList.toggle("expanded");
    });
    tl.appendChild(item);
  }
}

// --- Data ingestion ---
// MCP App Studio integration: listen for tool result data
window.addEventListener("message", (event: MessageEvent) => {
  if (event.data && event.data.type === "tool_result") {
    renderTimeline(event.data.result as TimelineData);
  }
});

// Check for data injected directly on window (mcp-app-studio pattern)
if ((window as any).__MCP_TOOL_RESULT__) {
  renderTimeline((window as any).__MCP_TOOL_RESULT__ as TimelineData);
}

// Fetch from backend if loaded via URL params
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");

if (sessionId) {
  const API_BASE = (window as any).__API_BASE__ ?? "http://localhost:8001";
  fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/timeline`)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data: { events: TimelineEvent[] }) => {
      renderTimeline({ session_id: sessionId, events: data.events });
    })
    .catch((err) => {
      console.error("[show_patient_timeline] Fetch failed:", err);
      // Fall through to demo data
    });
}

// Demo/preview: render sample data if nothing arrives within 600ms
setTimeout(() => {
  if (document.getElementById("timeline")!.children.length === 0) {
    renderTimeline({
      session_id: "demo",
      events: [
        { date: "2026-03-28T10:00:00Z", type: "session_created", title: "Session created: John Doe Visit", summary: "Patient session \"John Doe Visit\" was started.", color: "#7c3aed" },
        { date: "2026-03-28T10:05:00Z", type: "document_ingested", title: "Document uploaded: lab_results.pdf", summary: "APPLICATION/PDF • 3 pages ingested • Status: ingested", color: "#2563eb" },
        { date: "2026-03-28T10:10:00Z", type: "document_ingested", title: "Document uploaded: mri_scan.jpg", summary: "IMAGE/JPEG • 1 pages ingested • Status: ingested", color: "#2563eb" },
        { date: "2026-03-28T10:15:00Z", type: "note_created", title: "Clinical note recorded", summary: "Patient presents with persistent lower back pain radiating to left leg. MRI shows L4-L5 disc herniation. Recommended physical therapy and follow-up in 4 weeks.", color: "#16a34a" },
        { date: "2026-03-28T10:20:00Z", type: "note_created", title: "Clinical note recorded", summary: "Reviewed lab results — CBC and BMP within normal limits. Kidney function normal.", color: "#16a34a" },
      ],
    });
  }
}, 600);

// Init filters
renderFilters();
console.log("[show_patient_timeline] Loaded", { sessionId });

/**
 * Lab Charts App — renders Chart.js line charts from structured lab data.
 */

declare const Chart: any;

const API_BASE = "http://localhost:8001";

interface LabResult {
  test_name: string;
  value: number;
  unit: string;
  date: string;
  normal_min?: number;
  normal_max?: number;
}

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("session_id");
const labType = urlParams.get("lab_type");

const statusEl = document.getElementById("status")!;
const chartsEl = document.getElementById("charts")!;
const labTypeBadge = document.getElementById("labTypeBadge")!;

function showError(msg: string): void {
  statusEl.innerHTML = `<div class="error-state"><h3>⚠ Error</h3><p>${msg}</p></div>`;
  statusEl.style.display = "block";
}

function showEmpty(): void {
  statusEl.innerHTML = `<div class="empty-state"><div class="icon">📊</div><h3>No Lab Results</h3><p>No structured lab data found for this session.</p></div>`;
  statusEl.style.display = "block";
}

function groupByTestName(results: LabResult[]): Record<string, LabResult[]> {
  const groups: Record<string, LabResult[]> = {};
  for (const r of results) {
    if (!groups[r.test_name]) groups[r.test_name] = [];
    groups[r.test_name].push(r);
  }
  // Sort each group by date
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return groups;
}

function createChart(testName: string, results: LabResult[]): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "chart-card";

  const unit = results[0]?.unit ?? "";
  card.innerHTML = `<h3>${escapeHtml(testName)} <span class="unit">${escapeHtml(unit)}</span></h3>`;

  const canvas = document.createElement("canvas");
  card.appendChild(canvas);

  const labels = results.map((r) => r.date);
  const values = results.map((r) => r.value);

  const hasNormalRange = results.some((r) => r.normal_min != null && r.normal_max != null);
  const normalMin = results[0]?.normal_min;
  const normalMax = results[0]?.normal_max;

  const datasets: any[] = [
    {
      label: testName,
      data: values,
      borderColor: "#2563eb",
      backgroundColor: "#2563eb22",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#2563eb",
      tension: 0.3,
      fill: false,
    },
  ];

  if (hasNormalRange && normalMin != null && normalMax != null) {
    // Normal range upper bound (filled down to lower bound)
    datasets.push({
      label: "Normal Range",
      data: results.map(() => normalMax),
      borderColor: "transparent",
      backgroundColor: "#16a34a18",
      borderWidth: 0,
      pointRadius: 0,
      fill: "+1",
    });
    datasets.push({
      label: "_normalMin",
      data: results.map(() => normalMin),
      borderColor: "#16a34a44",
      backgroundColor: "transparent",
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false,
    });
  }

  new Chart(canvas.getContext("2d"), {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: hasNormalRange,
          labels: {
            filter: (item: any) => item.text !== "_normalMin",
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              if (ctx.dataset.label === "Normal Range" || ctx.dataset.label === "_normalMin") return "";
              return `${ctx.parsed.y} ${unit}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#64748b" },
        },
        y: {
          grid: { color: "#f1f5f9" },
          ticks: { font: { size: 11 }, color: "#64748b" },
        },
      },
    },
  });

  return card;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCharts(results: LabResult[]): void {
  if (!results.length) {
    showEmpty();
    return;
  }

  const groups = groupByTestName(results);
  statusEl.style.display = "none";
  chartsEl.style.display = "grid";
  chartsEl.innerHTML = "";

  for (const [testName, items] of Object.entries(groups)) {
    chartsEl.appendChild(createChart(testName, items));
  }
}

// ── Data loading ────────────────────────────────────────────────────────────
async function fetchLabData(): Promise<void> {
  if (!sessionId) {
    showError("Missing session_id in URL parameters.");
    return;
  }

  if (labType) {
    labTypeBadge.textContent = labType;
    labTypeBadge.style.display = "inline-block";
  }

  try {
    const queryText = labType || "lab results";
    const resp = await fetch(`${API_BASE}/query/structured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, query_text: queryText }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).detail ?? `HTTP ${resp.status}`,
      );
    }

    const data = (await resp.json()) as { results?: LabResult[] };
    renderCharts(data.results ?? []);
  } catch (err) {
    showError(`Failed to load lab data: ${(err as Error).message}`);
  }
}

// ── MCP App Studio integration ──────────────────────────────────────────────
window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type === "tool_result") {
    const result = event.data.result;
    if (result.results) renderCharts(result.results);
  }
});

if ((window as any).__MCP_TOOL_RESULT__) {
  const result = (window as any).__MCP_TOOL_RESULT__;
  if (result.results) renderCharts(result.results);
}

// Demo/preview mode: render sample data if no MCP data arrives within 500ms
setTimeout(() => {
  if (chartsEl.children.length === 0 && !(window as any).__MCP_TOOL_RESULT__) {
    if (sessionId) {
      fetchLabData();
    } else {
      // Demo data for preview
      renderCharts([
        { test_name: "Hemoglobin", value: 13.5, unit: "g/dL", date: "2026-01-15", normal_min: 12.0, normal_max: 17.5 },
        { test_name: "Hemoglobin", value: 12.8, unit: "g/dL", date: "2026-02-10", normal_min: 12.0, normal_max: 17.5 },
        { test_name: "Hemoglobin", value: 14.1, unit: "g/dL", date: "2026-03-05", normal_min: 12.0, normal_max: 17.5 },
        { test_name: "Glucose", value: 95, unit: "mg/dL", date: "2026-01-15", normal_min: 70, normal_max: 100 },
        { test_name: "Glucose", value: 110, unit: "mg/dL", date: "2026-02-10", normal_min: 70, normal_max: 100 },
        { test_name: "Glucose", value: 88, unit: "mg/dL", date: "2026-03-05", normal_min: 70, normal_max: 100 },
        { test_name: "Creatinine", value: 0.9, unit: "mg/dL", date: "2026-01-15", normal_min: 0.6, normal_max: 1.2 },
        { test_name: "Creatinine", value: 1.0, unit: "mg/dL", date: "2026-02-10", normal_min: 0.6, normal_max: 1.2 },
        { test_name: "Creatinine", value: 0.85, unit: "mg/dL", date: "2026-03-05", normal_min: 0.6, normal_max: 1.2 },
      ]);
    }
  }
}, 500);

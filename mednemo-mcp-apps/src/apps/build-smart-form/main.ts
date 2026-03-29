/**
 * Smart Form Builder App — renders dynamic forms from backend-generated fields.
 */

const API_BASE = "http://localhost:8001";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number";
  value?: string;
  options?: string[];
  editable?: boolean;
}

interface FormData {
  title?: string;
  fields?: FormField[];
  form_type?: string;
  session_id?: string;
}

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("session_id");
const formType = urlParams.get("form_type");

const statusEl = document.getElementById("status")!;
const formContainer = document.getElementById("formContainer")!;
const formTypeBadge = document.getElementById("formTypeBadge")!;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function showError(msg: string): void {
  statusEl.innerHTML = `<div class="error-state"><h3>⚠ Error</h3><p>${escapeHtml(msg)}</p></div>`;
  statusEl.style.display = "block";
  formContainer.style.display = "none";
}

function renderField(field: FormField): string {
  const isEditable = field.editable !== false;
  const readonlyAttr = isEditable ? "" : "readonly";
  const readonlyCls = isEditable ? "" : "readonly";
  const val = escapeHtml(field.value ?? "");

  let input = "";
  switch (field.type) {
    case "textarea":
      input = `<textarea name="${escapeHtml(field.name)}" ${readonlyAttr} class="${readonlyCls}">${val}</textarea>`;
      break;
    case "select":
      if (field.options?.length) {
        const opts = field.options
          .map((o) => `<option value="${escapeHtml(o)}" ${o === field.value ? "selected" : ""}>${escapeHtml(o)}</option>`)
          .join("");
        input = `<select name="${escapeHtml(field.name)}" ${isEditable ? "" : "disabled"} class="${readonlyCls}">${opts}</select>`;
      } else {
        input = `<input type="text" name="${escapeHtml(field.name)}" value="${val}" ${readonlyAttr} class="${readonlyCls}" />`;
      }
      break;
    case "date":
      input = `<input type="date" name="${escapeHtml(field.name)}" value="${val}" ${readonlyAttr} class="${readonlyCls}" />`;
      break;
    case "number":
      input = `<input type="number" name="${escapeHtml(field.name)}" value="${val}" ${readonlyAttr} class="${readonlyCls}" />`;
      break;
    default:
      input = `<input type="text" name="${escapeHtml(field.name)}" value="${val}" ${readonlyAttr} class="${readonlyCls}" />`;
  }

  return `<div class="field"><label>${escapeHtml(field.label)}</label>${input}</div>`;
}

function renderForm(data: FormData): void {
  const title = data.title ?? `${data.form_type ?? "Medical"} Form`;
  const fields = data.fields ?? [];

  if (!fields.length) {
    statusEl.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>No Fields</h3><p>The form has no fields to display.</p></div>`;
    statusEl.style.display = "block";
    return;
  }

  statusEl.style.display = "none";
  formContainer.style.display = "block";

  const fieldsHtml = fields.map(renderField).join("");

  formContainer.innerHTML = `
    <div class="form-title">${escapeHtml(title)}</div>
    ${fieldsHtml}
    <div class="actions">
      <button class="secondary" onclick="window.print()">🖨️ Print Form</button>
    </div>
  `;
}

// ── Data loading ────────────────────────────────────────────────────────────
async function fetchFormData(): Promise<void> {
  if (!sessionId || !formType) {
    showError("Missing session_id or form_type in URL parameters.");
    return;
  }

  if (formType) {
    formTypeBadge.textContent = formType;
    formTypeBadge.style.display = "inline-block";
  }

  try {
    const resp = await fetch(`${API_BASE}/forms/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form_type: formType,
        session_id: sessionId,
        patient_id: "unknown",
      }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).detail ?? `HTTP ${resp.status}`,
      );
    }

    const data = (await resp.json()) as FormData;
    renderForm(data);
  } catch (err) {
    showError(`Failed to generate form: ${(err as Error).message}`);
  }
}

// ── MCP App Studio integration ──────────────────────────────────────────────
window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type === "tool_result") {
    renderForm(event.data.result);
  }
});

if ((window as any).__MCP_TOOL_RESULT__) {
  renderForm((window as any).__MCP_TOOL_RESULT__);
}

// Demo/preview: render sample data if no MCP data arrives within 500ms
setTimeout(() => {
  if (formContainer.style.display === "none" && !(window as any).__MCP_TOOL_RESULT__) {
    if (sessionId && formType) {
      fetchFormData();
    } else {
      renderForm({
        title: "Patient Referral Form",
        form_type: "referral",
        fields: [
          { name: "patient_name", label: "Patient Name", type: "text", value: "Jane Doe", editable: false },
          { name: "dob", label: "Date of Birth", type: "date", value: "1985-06-15", editable: false },
          { name: "referring_physician", label: "Referring Physician", type: "text", value: "Dr. Smith", editable: false },
          { name: "specialty", label: "Referred Specialty", type: "select", options: ["Cardiology", "Neurology", "Orthopedics", "Oncology"], value: "Cardiology", editable: true },
          { name: "diagnosis", label: "Primary Diagnosis", type: "text", value: "Chronic lower back pain (M54.5)", editable: false },
          { name: "reason", label: "Reason for Referral", type: "textarea", value: "Patient has persistent symptoms despite conservative treatment.", editable: true },
          { name: "urgency", label: "Urgency", type: "select", options: ["Routine", "Urgent", "Emergent"], value: "Routine", editable: true },
          { name: "referral_date", label: "Referral Date", type: "date", value: "2026-03-28", editable: true },
        ],
      });
    }
  }
}, 500);

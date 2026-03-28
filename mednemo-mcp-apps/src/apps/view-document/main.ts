/**
 * Document Viewer — client-side UI script.
 * Reads session_id + document_id from URL params,
 * fetches document info from FastAPI, and renders PDF (via PDF.js) or image.
 */

// ── PDF.js CDN ──────────────────────────────────────────────────────────────
const PDFJS_VERSION = "4.9.155";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function loadPdfJs(): Promise<void> {
  if (pdfjsLib) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.mjs`;
    script.type = "module";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`;
        resolve();
      } else reject(new Error("PDF.js failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

// ── Constants ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8001";

// ── DOM refs ────────────────────────────────────────────────────────────────
const filenameEl = document.getElementById("filename")!;
const badgeEl = document.getElementById("filetype-badge")!;
const pageInfoEl = document.getElementById("page-info")!;
const zoomLevelEl = document.getElementById("zoom-level")!;
const btnPrev = document.getElementById("btn-prev") as HTMLButtonElement;
const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
const btnZoomIn = document.getElementById("btn-zoom-in") as HTMLButtonElement;
const btnZoomOut = document.getElementById("btn-zoom-out") as HTMLButtonElement;
const btnZoomFit = document.getElementById("btn-zoom-fit") as HTMLButtonElement;
const loadingState = document.getElementById("loading-state")!;
const errorState = document.getElementById("error-state")!;
const noUrlState = document.getElementById("no-url-state")!;
const pdfContainer = document.getElementById("pdf-container")!;
const imageContainer = document.getElementById("image-container")!;
const docImage = document.getElementById("doc-image") as HTMLImageElement;
const viewer = document.getElementById("viewer")!;

// ── State ───────────────────────────────────────────────────────────────────
let currentPage = 1;
let totalPages = 0;
let scale = 1.0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfDoc: any = null;
let isImage = false;
let imgTranslateX = 0;
let imgTranslateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5.0;

// ── Helpers ─────────────────────────────────────────────────────────────────
function showError(msg: string): void {
  loadingState.style.display = "none";
  pdfContainer.style.display = "none";
  imageContainer.style.display = "none";
  noUrlState.style.display = "none";
  errorState.style.display = "block";
  errorState.innerHTML = `<h3>⚠ Error</h3><p>${msg}</p>`;
}

function showNoUrl(info: Record<string, string>): void {
  loadingState.style.display = "none";
  pdfContainer.style.display = "none";
  imageContainer.style.display = "none";
  errorState.style.display = "none";
  noUrlState.style.display = "block";
  noUrlState.innerHTML = `
    <h3>📄 Document Found</h3>
    <p>No download URL available yet. The backend needs a signed-URL endpoint for document files.</p>
    <dl class="doc-info">
      <dt>File</dt><dd>${info.file_name ?? "—"}</dd>
      <dt>Type</dt><dd>${info.file_type ?? "—"}</dd>
      <dt>Status</dt><dd>${info.status ?? "—"}</dd>
      <dt>Pages</dt><dd>${info.pages_ingested ?? "—"}</dd>
      <dt>Document ID</dt><dd>${info.document_id ?? "—"}</dd>
    </dl>`;
}

function updateToolbar(): void {
  if (isImage) {
    pageInfoEl.textContent = "";
    btnPrev.disabled = true;
    btnNext.disabled = true;
  } else {
    pageInfoEl.textContent = `${currentPage} / ${totalPages}`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
  }
  zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
}

function inferContentType(fileName: string, fileType: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (fileType === "application/pdf" || ext === "pdf") return "application/pdf";
  if (["jpg", "jpeg"].includes(ext) || fileType.includes("jpeg")) return "image/jpeg";
  if (ext === "png" || fileType.includes("png")) return "image/png";
  if (ext === "gif" || fileType.includes("gif")) return "image/gif";
  if (ext === "webp" || fileType.includes("webp")) return "image/webp";
  return fileType || "application/octet-stream";
}

// ── PDF rendering ───────────────────────────────────────────────────────────
async function renderPdfPage(pageNum: number): Promise<void> {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  let canvas = pdfContainer.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    pdfContainer.appendChild(canvas);
  }
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
}

async function loadPdf(url: string): Promise<void> {
  await loadPdfJs();
  pdfDoc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
  totalPages = pdfDoc.numPages;
  currentPage = 1;
  loadingState.style.display = "none";
  pdfContainer.style.display = "flex";
  updateToolbar();
  await renderPdfPage(currentPage);
}

// ── Image rendering ─────────────────────────────────────────────────────────
function updateImageTransform(): void {
  docImage.style.transform =
    `translate(${imgTranslateX}px, ${imgTranslateY}px) scale(${scale})`;
}

function loadImage(url: string): void {
  isImage = true;
  loadingState.style.display = "none";
  imageContainer.style.display = "block";
  docImage.src = url;
  docImage.onload = () => {
    scale = 1.0;
    imgTranslateX = 0;
    imgTranslateY = 0;
    updateImageTransform();
    updateToolbar();
  };
  docImage.onerror = () => showError("Failed to load image.");
}

// ── Zoom ────────────────────────────────────────────────────────────────────
async function setZoom(newScale: number): Promise<void> {
  scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
  updateToolbar();
  if (isImage) updateImageTransform();
  else if (pdfDoc) await renderPdfPage(currentPage);
}

async function fitToWidth(): Promise<void> {
  if (isImage) {
    const containerWidth = viewer.clientWidth - 32;
    scale = containerWidth / (docImage.naturalWidth || 800);
    imgTranslateX = 0;
    imgTranslateY = 0;
    updateImageTransform();
    updateToolbar();
  } else if (pdfDoc) {
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1.0 });
    scale = (viewer.clientWidth - 32) / viewport.width;
    updateToolbar();
    await renderPdfPage(currentPage);
  }
}

// ── Event listeners ─────────────────────────────────────────────────────────
btnPrev.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    updateToolbar();
    await renderPdfPage(currentPage);
  }
});
btnNext.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    updateToolbar();
    await renderPdfPage(currentPage);
  }
});
btnZoomIn.addEventListener("click", () => setZoom(scale + ZOOM_STEP));
btnZoomOut.addEventListener("click", () => setZoom(scale - ZOOM_STEP));
btnZoomFit.addEventListener("click", () => fitToWidth());

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    btnPrev.click();
    e.preventDefault();
  } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    btnNext.click();
    e.preventDefault();
  } else if (e.key === "+" || e.key === "=") {
    setZoom(scale + ZOOM_STEP);
  } else if (e.key === "-") {
    setZoom(scale - ZOOM_STEP);
  }
});

viewer.addEventListener("wheel", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    setZoom(scale + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP));
  }
}, { passive: false });

// Image pan (drag)
imageContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX - imgTranslateX;
  dragStartY = e.clientY - imgTranslateY;
  imageContainer.classList.add("dragging");
  e.preventDefault();
});
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  imgTranslateX = e.clientX - dragStartX;
  imgTranslateY = e.clientY - dragStartY;
  docImage.style.transition = "none";
  updateImageTransform();
});
document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    imageContainer.classList.remove("dragging");
    docImage.style.transition = "transform 0.2s ease";
  }
});

// ── Data loading ────────────────────────────────────────────────────────────
interface DocumentInfo {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  pages_ingested: number;
  created_at: string;
}

interface DocumentResult {
  document_id: string;
  session_id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  status: string;
  pages_ingested: number;
  content_type: string;
  error?: string;
}

function handleResult(docResult: DocumentResult): void {
  if (docResult.error) {
    showError(docResult.error);
    return;
  }

  filenameEl.textContent = docResult.file_name;
  badgeEl.textContent =
    docResult.file_name.split(".").pop()?.toUpperCase() ?? "";

  if (!docResult.file_url) {
    showNoUrl({
      file_name: docResult.file_name,
      file_type: docResult.file_type,
      status: docResult.status,
      pages_ingested: String(docResult.pages_ingested),
      document_id: docResult.document_id,
    });
    return;
  }

  if (docResult.content_type === "application/pdf") {
    isImage = false;
    loadPdf(docResult.file_url).catch((err) =>
      showError(`Failed to load PDF: ${(err as Error).message}`)
    );
  } else if (docResult.content_type.startsWith("image/")) {
    loadImage(docResult.file_url);
  } else {
    showNoUrl({
      file_name: docResult.file_name,
      file_type: docResult.file_type,
      status: docResult.status,
      pages_ingested: String(docResult.pages_ingested),
      document_id: docResult.document_id,
    });
  }
}

async function init(): Promise<void> {
  // Check for embedded tool result (injected by MCP host)
  const toolResultEl = document.getElementById("tool-result");
  if (toolResultEl?.textContent?.trim()) {
    try {
      const result = JSON.parse(toolResultEl.textContent);
      handleResult(result);
      return;
    } catch {
      /* fall through to URL params */
    }
  }

  // Read from URL params
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const documentId = params.get("document_id");

  if (!sessionId || !documentId) {
    showError("Missing session_id or document_id in URL parameters.");
    return;
  }

  try {
    const resp = await fetch(
      `${API_BASE}/sessions/${encodeURIComponent(sessionId)}/documents`
    );
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).detail ?? `HTTP ${resp.status}`
      );
    }

    const documents = (await resp.json()) as DocumentInfo[];
    const doc = documents.find((d) => d.id === documentId);

    if (!doc) {
      showError(
        `Document ${documentId} not found. ` +
          `Available: ${documents.map((d) => d.file_name).join(", ") || "none"}`
      );
      return;
    }

    const contentType = inferContentType(doc.file_name, doc.file_type);

    // Try to get a signed file URL (endpoint may not exist yet)
    let fileUrl: string | null = null;
    try {
      const urlResp = await fetch(
        `${API_BASE}/sessions/${encodeURIComponent(sessionId)}/documents/${encodeURIComponent(documentId)}/url`
      );
      if (urlResp.ok) {
        const urlData = (await urlResp.json()) as { url: string };
        fileUrl = urlData.url;
      }
    } catch {
      /* endpoint may not exist yet */
    }

    handleResult({
      document_id: doc.id,
      session_id: sessionId,
      file_name: doc.file_name,
      file_type: doc.file_type,
      file_url: fileUrl,
      status: doc.status,
      pages_ingested: doc.pages_ingested,
      content_type: contentType,
    });
  } catch (err) {
    showError(`Failed to load document: ${(err as Error).message}`);
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────────────
init();

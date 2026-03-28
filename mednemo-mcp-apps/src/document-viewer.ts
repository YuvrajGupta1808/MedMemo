import { z } from "zod";

const API_BASE = "http://localhost:8001";

export const viewDocumentToolName = "view_document";

export const viewDocumentParams = z.object({
  session_id: z.string().describe("Session ID containing the document"),
  document_id: z.string().describe("Document ID to view"),
});

export type ViewDocumentParams = z.infer<typeof viewDocumentParams>;

export interface DocumentInfo {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  pages_ingested: number;
  created_at: string;
  storage_path?: string;
}

export interface ViewDocumentResult {
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

/**
 * Determine content type from file_type/file_name for rendering decisions.
 */
function inferContentType(fileName: string, fileType: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (fileType === "application/pdf" || ext === "pdf") return "application/pdf";
  if (["jpg", "jpeg"].includes(ext) || fileType.includes("jpeg"))
    return "image/jpeg";
  if (ext === "png" || fileType.includes("png")) return "image/png";
  if (ext === "gif" || fileType.includes("gif")) return "image/gif";
  if (ext === "webp" || fileType.includes("webp")) return "image/webp";
  if (ext === "svg" || fileType.includes("svg")) return "image/svg+xml";
  if (ext === "tiff" || ext === "tif" || fileType.includes("tiff"))
    return "image/tiff";
  return fileType || "application/octet-stream";
}

export async function viewDocument(
  params: ViewDocumentParams,
): Promise<ViewDocumentResult> {
  // Fetch all documents for the session
  const response = await fetch(
    `${API_BASE}/sessions/${encodeURIComponent(params.session_id)}/documents`,
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).detail ??
        `Failed to fetch documents: ${response.status}`,
    );
  }

  const documents = (await response.json()) as DocumentInfo[];

  // Find the matching document
  const doc = documents.find((d) => d.id === params.document_id);
  if (!doc) {
    throw new Error(
      `Document ${params.document_id} not found in session ${params.session_id}. ` +
        `Available: ${documents.map((d) => `${d.file_name} (${d.id})`).join(", ") || "none"}`,
    );
  }

  const contentType = inferContentType(doc.file_name, doc.file_type);

  // Try to get a signed file URL via the download endpoint
  let fileUrl: string | null = null;
  try {
    const downloadRes = await fetch(
      `${API_BASE}/sessions/${encodeURIComponent(params.session_id)}/documents/${encodeURIComponent(params.document_id)}/url`,
    );
    if (downloadRes.ok) {
      const urlData = (await downloadRes.json()) as { url: string };
      fileUrl = urlData.url;
    }
  } catch {
    // Download endpoint may not exist yet — that's OK
  }

  return {
    document_id: doc.id,
    session_id: params.session_id,
    file_name: doc.file_name,
    file_type: doc.file_type,
    file_url: fileUrl,
    status: doc.status,
    pages_ingested: doc.pages_ingested,
    content_type: contentType,
  };
}

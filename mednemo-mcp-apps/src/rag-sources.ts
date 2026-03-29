import { z } from "zod";

const API_BASE = "http://localhost:8001";

export const showRagSourcesToolName = "show_rag_sources";

export const showRagSourcesParams = z.object({
  session_id: z.string().describe("Session ID to query documents in"),
  query: z.string().describe("Natural language search query"),
});

export type ShowRagSourcesParams = z.infer<typeof showRagSourcesParams>;

export interface RagPage {
  document_id: string;
  page_number: number;
  session_id: string;
  document_type: string;
  image_b64: string;
  /** Synthetic relevance score based on result ranking (1.0 = most relevant) */
  relevance: number;
}

export interface ShowRagSourcesResult {
  query: string;
  session_id: string;
  answer: string;
  pages: RagPage[];
}

export async function showRagSources(
  params: ShowRagSourcesParams,
): Promise<ShowRagSourcesResult> {
  const response = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: params.query,
      session_id: params.session_id,
      limit: 10,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).detail ??
        `Query failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    answer: string;
    session_id: string;
    pages: Array<{
      document_id: string;
      page_number: number;
      session_id: string;
      document_type?: string;
      image_b64?: string;
    }>;
  };

  // Assign synthetic relevance scores based on ranking position
  // Weaviate returns results ordered by vector similarity (best first)
  const totalPages = data.pages.length;
  const pages: RagPage[] = data.pages.map((page, index) => ({
    document_id: page.document_id ?? "",
    page_number: page.page_number ?? 0,
    session_id: page.session_id ?? params.session_id,
    document_type: page.document_type ?? "pdf",
    image_b64: page.image_b64 ?? "",
    // Linear decay: first result = 1.0, last = 0.3 (minimum)
    relevance:
      totalPages > 1
        ? Math.round((1.0 - (index / (totalPages - 1)) * 0.7) * 100) / 100
        : 1.0,
  }));

  return {
    query: params.query,
    session_id: params.session_id,
    answer: data.answer,
    pages,
  };
}

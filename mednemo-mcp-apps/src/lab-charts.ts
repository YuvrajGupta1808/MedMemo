import { z } from "zod";

const API_BASE = "http://localhost:8001";

export const showLabChartsToolName = "show_lab_charts";

export const showLabChartsParams = z.object({
  session_id: z.string().describe("Session ID to query lab results for"),
  lab_type: z
    .string()
    .optional()
    .describe("Optional filter by lab type (e.g. CBC, BMP)"),
});

export type ShowLabChartsParams = z.infer<typeof showLabChartsParams>;

export interface LabResult {
  test_name: string;
  value: number;
  unit: string;
  date: string;
  normal_min: number;
  normal_max: number;
}

export interface ShowLabChartsResult {
  session_id: string;
  lab_type: string | null;
  results: LabResult[];
  ui_url: string;
}

export async function showLabCharts(
  params: ShowLabChartsParams,
): Promise<ShowLabChartsResult> {
  const queryText = params.lab_type
    ? `${params.lab_type} lab results`
    : "all lab results blood work laboratory tests";

  const response = await fetch(`${API_BASE}/query/structured`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: params.session_id,
      query_text: queryText,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).detail ??
        `Structured query failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { results: LabResult[] };

  const uiUrl = `/apps/show-lab-charts/index.html?session_id=${encodeURIComponent(params.session_id)}${params.lab_type ? `&lab_type=${encodeURIComponent(params.lab_type)}` : ""}`;

  return {
    session_id: params.session_id,
    lab_type: params.lab_type ?? null,
    results: data.results,
    ui_url: uiUrl,
  };
}

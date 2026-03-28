import { z } from "zod";

const API_BASE = "http://localhost:8001";

export const showPatientTimelineToolName = "show_patient_timeline";

export const showPatientTimelineParams = z.object({
  session_id: z.string().describe("Session ID to fetch timeline for"),
});

export type ShowPatientTimelineParams = z.infer<typeof showPatientTimelineParams>;

export interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  summary: string;
  color: string;
}

export interface ShowPatientTimelineResult {
  session_id: string;
  events: TimelineEvent[];
  ui_url: string;
}

export async function showPatientTimeline(
  params: ShowPatientTimelineParams,
): Promise<ShowPatientTimelineResult> {
  const response = await fetch(
    `${API_BASE}/sessions/${encodeURIComponent(params.session_id)}/timeline`,
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).detail ??
        `Failed to fetch timeline: ${response.status}`,
    );
  }

  const data = (await response.json()) as { events: TimelineEvent[] };

  return {
    session_id: params.session_id,
    events: data.events,
    ui_url: `/apps/show-patient-timeline/index.html?session_id=${encodeURIComponent(params.session_id)}`,
  };
}

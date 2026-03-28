import { z } from "zod";

const API_BASE = "http://localhost:8001";

export const buildSmartFormToolName = "build_smart_form";

export const buildSmartFormParams = z.object({
  session_id: z.string().describe("Session ID for patient context"),
  form_type: z
    .string()
    .describe("Form type: referral | prescription | prior_auth"),
  patient_id: z
    .string()
    .optional()
    .describe("Patient ID (defaults to 'unknown')"),
});

export type BuildSmartFormParams = z.infer<typeof buildSmartFormParams>;

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number";
  value?: string;
  options?: string[];
  editable?: boolean;
}

export interface BuildSmartFormResult {
  session_id: string;
  form_type: string;
  title: string;
  fields: FormField[];
  ui_url: string;
}

export async function buildSmartForm(
  params: BuildSmartFormParams,
): Promise<BuildSmartFormResult> {
  const response = await fetch(`${API_BASE}/forms/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form_type: params.form_type,
      session_id: params.session_id,
      patient_id: params.patient_id || "unknown",
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).detail ??
        `Failed to generate form: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    title?: string;
    fields?: FormField[];
  };

  return {
    session_id: params.session_id,
    form_type: params.form_type,
    title: data.title ?? `${params.form_type} Form`,
    fields: data.fields ?? [],
    ui_url: `/apps/build-smart-form/index.html?session_id=${encodeURIComponent(params.session_id)}&form_type=${encodeURIComponent(params.form_type)}`,
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Types ----------

export interface IngestResult {
  file_name: string;
  document_id: string;
  pages_ingested: number;
  status: string;
  error?: string;
}

export interface IngestResponse {
  session_id: string;
  results: IngestResult[];
  total_pages: number;
}

export interface UploadAudioResponse {
  storage_path: string;
  audio_url: string;
}

export interface TranscribeResponse {
  note_id: string;
  session_id: string;
  summary: string;
  segments: { timestamp: string; speaker: string; text: string }[];
  audio_url: string;
  created_at: string;
}

// ---------- Sessions ----------

export async function apiCreateSession(user_id: string, name: string): Promise<{ id: string; name: string }> {
  return apiFetch('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, name }),
  });
}

// ---------- Ingest ----------

export async function apiIngestFiles(files: File[], user_id: string, session_id: string): Promise<IngestResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  fd.append('user_id', user_id);
  fd.append('session_id', session_id);
  return apiFetch<IngestResponse>('/ingest', { method: 'POST', body: fd });
}

export async function apiDeleteDocument(document_id: string) {
  return apiFetch<{ deleted: boolean; document_id: string }>(`/ingest/documents/${document_id}`, {
    method: 'DELETE',
  });
}

// ---------- Notes ----------

export async function apiUploadAudio(audio: File, user_id: string, session_id: string): Promise<UploadAudioResponse> {
  const fd = new FormData();
  fd.append('audio_file', audio);
  fd.append('user_id', user_id);
  fd.append('session_id', session_id);
  return apiFetch<UploadAudioResponse>('/notes/upload', { method: 'POST', body: fd });
}

export async function apiTranscribe(
  storage_path: string,
  user_id: string,
  session_id: string,
  mime_type: string,
): Promise<TranscribeResponse> {
  return apiFetch<TranscribeResponse>('/notes/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_path, user_id, session_id, mime_type }),
  });
}

import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

async function backendFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `Backend error ${res.status}: ${text}` };
  }
  return res.json();
}

const tools = {
  query_patient_documents: tool({
    description: 'Search and query the patient session documents using RAG. Use this when the doctor asks ANY question about a patient — symptoms, history, medications, lab results, diagnoses, treatment plans.',
    parameters: z.object({
      question: z.string().describe('The clinical question to search for'),
      session_id: z.string().describe('The session ID to search in'),
      limit: z.number().optional().default(3).describe('Number of document pages to retrieve (1-10)'),
    }),
    execute: async ({ question, session_id, limit }) => {
      return backendFetch('/query', {
        method: 'POST',
        body: JSON.stringify({ text: question, session_id, limit }),
      });
    },
  }),

  list_sessions: tool({
    description: 'List all patient sessions for a user. Use when the doctor wants to see their sessions or find a patient.',
    parameters: z.object({
      user_id: z.string().describe('The user/doctor ID'),
    }),
    execute: async ({ user_id }) => {
      return backendFetch(`/sessions/user/${encodeURIComponent(user_id)}`);
    },
  }),

  get_session_documents: tool({
    description: 'List all documents ingested in a patient session. Shows file names, status, and page counts.',
    parameters: z.object({
      session_id: z.string().describe('The session ID'),
    }),
    execute: async ({ session_id }) => {
      return backendFetch(`/sessions/${encodeURIComponent(session_id)}/documents`);
    },
  }),

  get_session_details: tool({
    description: 'Get details about a specific patient session including name and creation date.',
    parameters: z.object({
      session_id: z.string().describe('The session ID'),
    }),
    execute: async ({ session_id }) => {
      return backendFetch(`/sessions/${encodeURIComponent(session_id)}`);
    },
  }),

  list_session_notes: tool({
    description: 'List all clinical audio notes/transcriptions for a patient session.',
    parameters: z.object({
      session_id: z.string().describe('The session ID'),
      user_id: z.string().describe('The user/doctor ID'),
    }),
    execute: async ({ session_id, user_id }) => {
      return backendFetch(`/notes/${encodeURIComponent(session_id)}?user_id=${encodeURIComponent(user_id)}`);
    },
  }),
};

export async function POST(req: Request) {
  const { messages, ...body } = await req.json();

  // Extract context from frontend (patientId, patientName, page)
  const context = body?.context ?? {};
  const patientName = context.patientName ?? 'the patient';
  const patientId = context.patientId ?? '';
  const sessionId = context.sessionId ?? '';
  const userId = context.userId ?? 'dr.sarah';

  const systemPrompt = `You are MedNemo, an AI medical assistant for doctors.
You help answer clinical questions about patients using their ingested medical documents.

Current context:
- Doctor/User ID: ${userId}
- Patient: ${patientName}${patientId ? ` (ID: ${patientId})` : ''}${sessionId ? `\n- Active Session ID: ${sessionId}` : ''}

Available tools:
1. query_patient_documents — Search patient documents to answer clinical questions. ALWAYS use this when asked about a patient's health, symptoms, medications, lab results, etc.
2. list_sessions — List all patient sessions. Use when the doctor wants to see or find sessions.
3. get_session_documents — List documents in a session. Use to show what's been ingested.
4. get_session_details — Get session info (name, dates).
5. list_session_notes — List clinical audio transcriptions for a session.

Instructions:
- When the doctor asks about a patient, ALWAYS use query_patient_documents first to search the documents.
- Base your answers on the retrieved document content. Cite which documents the information comes from.
- If no session ID is available, use list_sessions to find the right session first.
- Do NOT say "I cannot provide information about individuals" — your purpose IS to answer questions about patients using their documents.
- If query returns no results, say "I don't see information about that in the ingested documents."
- Be conversational, professional, and cite sources.`;

  const result = await streamText({
    model: google('gemini-2.0-flash'),
    messages,
    system: systemPrompt,
    tools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}

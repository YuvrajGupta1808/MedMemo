'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Citation } from '@/components/tool-ui/citation';
import { DataTable } from '@/components/tool-ui/data-table';
import { StatsDisplay } from '@/components/tool-ui/stats-display';

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'call' | 'result' | 'partial-call';
  result?: unknown;
}

function ToolLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{message}</div>;
}

function QueryResultUI({ result }: { result: Record<string, unknown> }) {
  if (result?.error) return <ErrorMessage message={String(result.error)} />;
  const pages = (result?.pages as Array<Record<string, unknown>>) || [];
  if (pages.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mt-1">
      <p className="text-xs text-slate-500 font-medium">📄 Sources ({pages.length})</p>
      <div className="flex flex-col gap-2">
        {pages.map((page, i) => {
          const meta = (page.metadata as Record<string, unknown>) || {};
          const fileName = String(meta.file_name || meta.source || `Document ${i + 1}`);
          const content = typeof page.content === 'string' ? page.content.slice(0, 200) : '';
          const pageNum = meta.page_number ?? i + 1;
          return (
            <Citation
              key={i}
              id={`source-${i}`}
              title={fileName}
              snippet={content}
              href={`https://mednemo.local/documents/${encodeURIComponent(fileName)}`}
              type="document"
              domain={`Page ${pageNum}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function SessionsListUI({ result }: { result: unknown }) {
  if (result && typeof result === 'object' && 'error' in result) {
    return <ErrorMessage message={String((result as Record<string, unknown>).error)} />;
  }
  const sessions = Array.isArray(result) ? result : [];
  if (sessions.length === 0) {
    return <div className="text-sm text-slate-500 px-3 py-2">No sessions found.</div>;
  }
  return (
    <DataTable
      id="sessions-list"
      columns={[
        { key: 'name', label: 'Patient Session' },
        { key: 'id', label: 'Session ID' },
        { key: 'created_at', label: 'Created' },
      ]}
      data={sessions.map((s: Record<string, unknown>) => ({
        name: String(s.name || 'Untitled'),
        id: String(s.id || ''),
        created_at: String(s.created_at || ''),
      }))}
      emptyMessage="No sessions found"
    />
  );
}

function SessionDocumentsUI({ result }: { result: unknown }) {
  if (result && typeof result === 'object' && 'error' in result) {
    return <ErrorMessage message={String((result as Record<string, unknown>).error)} />;
  }
  const docs = Array.isArray(result) ? result : [];
  if (docs.length === 0) {
    return <div className="text-sm text-slate-500 px-3 py-2">No documents in this session.</div>;
  }
  return (
    <DataTable
      id="session-documents"
      columns={[
        { key: 'file_name', label: 'File Name' },
        { key: 'status_display', label: 'Status' },
        { key: 'pages_ingested', label: 'Pages' },
      ]}
      data={docs.map((d: Record<string, unknown>) => ({
        file_name: String(d.file_name || 'Unknown'),
        status_display: String(d.status || 'unknown'),
        pages_ingested: String(d.pages_ingested ?? 0),
      }))}
      emptyMessage="No documents found"
    />
  );
}

function SessionDetailsUI({ result }: { result: Record<string, unknown> }) {
  if (result?.error) return <ErrorMessage message={String(result.error)} />;
  if (!result?.id) return null;
  return (
    <StatsDisplay
      id="session-details"
      title={String(result.name || 'Session')}
      stats={[
        { key: 'id', label: 'Session ID', value: String(result.id || '') },
        { key: 'created', label: 'Created', value: String(result.created_at || 'Unknown') },
      ]}
    />
  );
}

function SessionNotesUI({ result }: { result: unknown }) {
  if (result && typeof result === 'object' && 'error' in result) {
    return <ErrorMessage message={String((result as Record<string, unknown>).error)} />;
  }
  const notes = Array.isArray(result) ? result : [];
  if (notes.length === 0) {
    return <div className="text-sm text-slate-500 px-3 py-2">No clinical notes in this session.</div>;
  }
  return (
    <DataTable
      id="session-notes"
      columns={[
        { key: 'created_at', label: 'Date' },
        { key: 'summary', label: 'Summary' },
      ]}
      data={notes.map((n: Record<string, unknown>) => ({
        created_at: String(n.created_at || ''),
        summary: String(n.summary || 'No summary'),
      }))}
      emptyMessage="No notes found"
    />
  );
}

const TOOL_LOADING_LABELS: Record<string, string> = {
  query_patient_documents: 'Searching patient documents…',
  list_sessions: 'Loading sessions…',
  get_session_documents: 'Loading documents…',
  get_session_details: 'Loading session details…',
  list_session_notes: 'Loading clinical notes…',
};

export function ToolCallRenderer({ invocation }: { invocation: ToolInvocation }) {
  const { toolName, state, result } = invocation;

  if (state === 'call' || state === 'partial-call') {
    return <ToolLoading label={TOOL_LOADING_LABELS[toolName] || 'Working…'} />;
  }

  switch (toolName) {
    case 'query_patient_documents':
      return <QueryResultUI result={result as Record<string, unknown>} />;
    case 'list_sessions':
      return <SessionsListUI result={result} />;
    case 'get_session_documents':
      return <SessionDocumentsUI result={result} />;
    case 'get_session_details':
      return <SessionDetailsUI result={result as Record<string, unknown>} />;
    case 'list_session_notes':
      return <SessionNotesUI result={result} />;
    default:
      return null;
  }
}

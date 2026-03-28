'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Mic,
  FileText,
  ClipboardList,
  Sparkles,
  Download,
  ChevronLeft,
  Bell,
  LayoutDashboard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Chatbot from '@/components/Chatbot';
import { StatsDisplay } from '@/components/tool-ui/stats-display/stats-display';
import { DataTable } from '@/components/tool-ui/data-table/data-table';
import {
  fetchUser,
  fetchSessions,
  fetchDocumentsForUser,
  fetchNotesForUser,
  type Patient,
  type Session,
  type Document,
  type Note,
} from '@/lib/supabase';

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'sessions' | 'notes'>('overview');
  const [user, setUser] = useState<Patient | null>(null);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    if (id) loadPatientData(id as string);
  }, [id]);

  async function loadPatientData(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const [userData, sessionsData, docsData, notesData] = await Promise.all([
        fetchUser(userId),
        fetchSessions(userId),
        fetchDocumentsForUser(userId),
        fetchNotesForUser(userId),
      ]);
      setUser(userData);
      setUserSessions(sessionsData);
      setDocuments(docsData);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <User size={16} /> },
    { key: 'documents' as const, label: 'Documents', icon: <FileText size={16} /> },
    { key: 'sessions' as const, label: 'Sessions', icon: <Mic size={16} /> },
    { key: 'notes' as const, label: 'Notes', icon: <ClipboardList size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 focus-ring"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg" aria-hidden="true">
            +
          </div>
          <span className="text-lg font-bold tracking-tight">MedNemo</span>
        </div>

        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={false} onClick={() => router.push('/')} />
          <NavItem icon={<User size={16} />} label="Patients" active={true} onClick={() => {}} />
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors focus-ring ${showChat ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            aria-label={showChat ? 'Hide AI assistant' : 'Show AI assistant'}
            aria-pressed={showChat}
          >
            <Sparkles size={20} />
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-ring" aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex overflow-hidden">
        {/* Left content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {loading ? (
            <div className="max-w-4xl mx-auto" role="status" aria-label="Loading patient data">
              <div className="skeleton h-6 w-48 mb-4" />
              <div className="skeleton h-4 w-32 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
                    <div className="skeleton h-4 w-2/3 mb-3" />
                    <div className="skeleton h-3 w-1/2 mb-2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                ))}
              </div>
              <span className="sr-only">Loading…</span>
            </div>
          ) : error ? (
            <div role="alert" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Failed to load patient</h2>
              <p className="text-sm text-slate-600 mb-4 max-w-md">{error}</p>
              <button onClick={() => loadPatientData(id as string)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 focus-ring transition-colors">
                <RefreshCw size={14} aria-hidden="true" /> Try again
              </button>
            </div>
          ) : user ? (
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-1.5 text-sm text-slate-500">
                  <li><button onClick={() => router.push('/')} className="hover:text-slate-800 focus-ring rounded px-1 transition-colors">Dashboard</button></li>
                  <li aria-hidden="true">/</li>
                  <li className="text-slate-900 font-medium" aria-current="page">{user.external_id}</li>
                </ol>
              </nav>

              {/* Patient header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
                  {user.external_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{user.external_id}</h1>
                  <p className="text-sm text-slate-600">
                    Patient since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Tab bar */}
              <div role="tablist" aria-label="Patient sections" className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    aria-controls={`panel-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div id={`panel-${activeTab}`} role="tabpanel" aria-label={activeTab}>
                {activeTab === 'overview' && (
                  <OverviewPanel user={user} sessions={userSessions} documents={documents} notes={notes} />
                )}
                {activeTab === 'documents' && (
                  <DocumentsPanel documents={documents} />
                )}
                {activeTab === 'sessions' && (
                  <SessionsPanel sessions={userSessions} />
                )}
                {activeTab === 'notes' && (
                  <NotesPanel notes={notes} />
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Sidebar - Chatbot */}
        {showChat && user && (
          <aside className="hidden lg:flex w-[380px] bg-white border-l border-slate-200 flex-col shrink-0 overflow-hidden" aria-label="AI Assistant">
            <Chatbot patientName={user.external_id} />
          </aside>
        )}
      </main>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors focus-ring ${
        active
          ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function OverviewPanel({ user, sessions, documents, notes }: { user: Patient; sessions: Session[]; documents: Document[]; notes: Note[] }) {
  // Stats for StatsDisplay component
  const stats = [
    { key: 'sessions', label: 'Sessions', value: sessions.length, format: { kind: 'number' as const } },
    { key: 'documents', label: 'Documents', value: documents.length, format: { kind: 'number' as const } },
    { key: 'notes', label: 'Notes', value: notes.length, format: { kind: 'number' as const } },
  ];

  // Documents table data
  const docTableData = documents.slice(0, 10).map((d) => ({
    name: d.file_name,
    type: d.file_type.toUpperCase(),
    pages: d.pages_ingested,
    status: d.status,
    date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Sessions table data
  const sessionTableData = sessions.slice(0, 10).map((s) => ({
    name: s.name,
    created: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    updated: new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Display — tool-ui component */}
      <StatsDisplay
        id="patient-stats"
        title={`${user.external_id} — Overview`}
        description={`Patient since ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
        stats={stats}
        className="max-w-full"
      />

      {/* Documents Table — tool-ui component */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Documents</h3>
          <DataTable
            id="patient-documents"
            columns={[
              { key: 'name', label: 'File Name', priority: 'primary' },
              { key: 'type', label: 'Type' },
              { key: 'pages', label: 'Pages', format: { kind: 'number' }, align: 'right' },
              { key: 'status', label: 'Status' },
              { key: 'date', label: 'Date' },
            ]}
            data={docTableData}
            emptyMessage="No documents uploaded yet."
          />
        </div>
      )}

      {/* Sessions Table — tool-ui component */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Sessions</h3>
          <DataTable
            id="patient-sessions"
            columns={[
              { key: 'name', label: 'Session Name', priority: 'primary' },
              { key: 'created', label: 'Created' },
              { key: 'updated', label: 'Last Updated' },
            ]}
            data={sessionTableData}
            emptyMessage="No sessions yet."
          />
        </div>
      )}
    </div>
  );
}

function DocumentsPanel({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <EmptyPanel
        icon={<FileText size={28} />}
        title="No documents yet"
        description="Upload documents through the chat assistant or the API."
      />
    );
  }

  const tableData = documents.map((d) => ({
    name: d.file_name,
    type: d.file_type.toUpperCase(),
    pages: d.pages_ingested,
    status: d.status,
    date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  return (
    <DataTable
      id="all-documents"
      columns={[
        { key: 'name', label: 'File Name', priority: 'primary' },
        { key: 'type', label: 'Type' },
        { key: 'pages', label: 'Pages', format: { kind: 'number' }, align: 'right' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ]}
      data={tableData}
      defaultSort={{ by: 'date', direction: 'desc' }}
      emptyMessage="No documents uploaded yet."
    />
  );
}

function SessionsPanel({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyPanel
        icon={<Mic size={28} />}
        title="No sessions yet"
        description="Create a session through the chat assistant to get started."
      />
    );
  }

  const tableData = sessions.map((s) => ({
    name: s.name,
    created: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    updated: new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  return (
    <DataTable
      id="all-sessions"
      columns={[
        { key: 'name', label: 'Session Name', priority: 'primary' },
        { key: 'created', label: 'Created' },
        { key: 'updated', label: 'Last Updated' },
      ]}
      data={tableData}
      defaultSort={{ by: 'created', direction: 'desc' }}
      emptyMessage="No sessions yet."
    />
  );
}

function NotesPanel({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <EmptyPanel
        icon={<ClipboardList size={28} />}
        title="No notes yet"
        description="Record an audio session to generate transcription notes."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => (
        <div key={note.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-500">
                {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <button className="text-xs font-medium text-blue-700 hover:underline focus-ring rounded px-1 flex items-center gap-1" aria-label="Download note">
              <Download size={12} aria-hidden="true" /> Export
            </button>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{note.summary}</p>
          {note.segments.length > 0 && (
            <details className="group">
              <summary className="text-xs font-medium text-blue-700 cursor-pointer hover:underline focus-ring rounded px-1">
                View transcript ({note.segments.length} segments)
              </summary>
              <div className="mt-3 flex flex-col gap-2 pl-4 border-l-2 border-slate-100">
                {note.segments.map((seg, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-xs font-medium text-slate-500">{seg.timestamp} — {seg.speaker}</span>
                    <p className="text-slate-700">{seg.text}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-600 max-w-md">{description}</p>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
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
  Loader2,
  CheckCircle2,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import Chatbot from '@/components/Chatbot';
import { StatsDisplay } from '@/components/tool-ui/stats-display/stats-display';
import { DataTable } from '@/components/tool-ui/data-table/data-table';
import { ProgressTracker } from '@/components/tool-ui/progress-tracker/progress-tracker';
import { CitationList } from '@/components/tool-ui/citation/citation-list';
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
import {
  apiIngestFiles,
  apiDeleteDocument,
  apiUploadAudio,
  apiTranscribe,
  type IngestResult,
} from '@/lib/api';

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'notes'>('overview');
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

  const reload = () => loadPatientData(id as string);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <User size={16} /> },
    { key: 'documents' as const, label: 'Documents', icon: <FileText size={16} /> },
    { key: 'notes' as const, label: 'Notes', icon: <ClipboardList size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 focus-ring"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg" aria-hidden="true">
              +
            </div>
            <span className="text-lg font-bold tracking-tight">MedNemo</span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={false} onClick={() => router.push('/dashboard')} />
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
                  <DocumentsPanel documents={documents} sessions={userSessions} user={user} reload={reload} />
                )}
                {activeTab === 'notes' && (
                  <NotesPanel notes={notes} sessions={userSessions} user={user} reload={reload} />
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
        className="w-full"
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

function DocumentsPanel({ documents, sessions, user, reload }: { documents: Document[]; sessions: Session[]; user: Patient; reload: () => void }) {
  const sessionId = sessions[0]?.id ?? null;
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<IngestResult[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const files = fileRef.current?.files;
    if (!files || files.length === 0 || !sessionId) return;
    setUploading(true);
    setActionError(null);
    setUploadResults(null);
    try {
      const res = await apiIngestFiles(Array.from(files), user.external_id, sessionId);
      setUploadResults(res.results);
      if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(doc: Document) {
    if (!confirm(`Delete document "${doc.file_name}"?`)) return;
    setActionError(null);
    try {
      await apiDeleteDocument(doc.id);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }

  const processingDocs = documents.filter((d) => d.status === 'processing' || d.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      {/* Upload section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Upload size={14} /> Upload Documents</h3>
        {!sessionId ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <AlertCircle size={16} className="shrink-0 text-slate-400" />
            No session found for this patient. Create one via the MedNemo agent before uploading documents.
          </div>
        ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Files</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpeg,.jpg,.png" multiple className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm file:font-medium" />
          </div>
          <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {uploading && <Loader2 size={14} className="animate-spin" />} Upload &amp; Ingest
          </button>
        </div>
        )}
        {uploadResults && (
          <div className="mt-3 space-y-1">
            {uploadResults.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${r.status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {r.status === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                {r.file_name} {r.status === 'error' ? `— ${r.error}` : `— ${r.pages_ingested} pages ingested`}
              </div>
            ))}
          </div>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {/* Processing pipeline */}
      {processingDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Processing Pipeline</h3>
          {processingDocs.map((doc) => (
            <div key={doc.id} className="mb-4">
              <ProgressTracker
                id={`doc-progress-${doc.id}`}
                steps={[
                  { id: 'upload', label: 'Uploaded', description: doc.file_name, status: 'completed' },
                  { id: 'extract', label: 'Text Extraction', description: 'OCR and content parsing', status: doc.status === 'processing' ? 'in-progress' : 'pending' },
                  { id: 'embed', label: 'Embedding', description: 'Generating vector embeddings', status: 'pending' },
                  { id: 'index', label: 'Indexed', description: 'Ready for semantic search', status: 'pending' },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {/* Documents table with delete */}
      {documents.length === 0 ? (
        <EmptyPanel icon={<FileText size={28} />} title="No documents yet" description="Upload documents above to get started." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-600">File Name</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Type</th>
                <th className="text-right px-5 py-3 font-medium text-slate-600">Pages</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{d.file_name}</td>
                  <td className="px-5 py-3 text-slate-600">{d.file_type.toUpperCase()}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">{d.pages_ingested}</td>
                  <td className="px-5 py-3 text-slate-600">{d.status}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDeleteDoc(d)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label={`Delete ${d.file_name}`}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NotesPanel({ notes, sessions, user, reload }: { notes: Note[]; sessions: Session[]; user: Patient; reload: () => void }) {
  const sessionId = sessions[0]?.id ?? null;
  const [step, setStep] = useState<'idle' | 'uploading' | 'transcribing'>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);

  async function handleUploadAndTranscribe() {
    const file = audioRef.current?.files?.[0];
    if (!file || !sessionId) return;
    setActionError(null);
    setSuccess(false);
    try {
      setStep('uploading');
      const uploadRes = await apiUploadAudio(file, user.external_id, sessionId);
      setStep('transcribing');
      await apiTranscribe(uploadRes.storage_path, user.external_id, sessionId, file.type || 'audio/mpeg');
      if (audioRef.current) audioRef.current.value = '';
      setSuccess(true);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setStep('idle');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload audio section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Mic size={14} /> Record / Upload Audio</h3>
        {!sessionId ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <AlertCircle size={16} className="shrink-0 text-slate-400" />
            No session found for this patient. Create one via the MedNemo agent before uploading documents.
          </div>
        ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Audio file</label>
            <input ref={audioRef} type="file" accept="audio/*" className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm file:font-medium" />
          </div>
          <button onClick={handleUploadAndTranscribe} disabled={step !== 'idle'} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {step !== 'idle' && <Loader2 size={14} className="animate-spin" />}
            {step === 'uploading' ? 'Uploading…' : step === 'transcribing' ? 'Transcribing…' : 'Upload & Transcribe'}
          </button>
        </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <CheckCircle2 size={16} /> Transcription complete! Note added.
          </div>
        )}
        {actionError && <div className="mt-3"><ErrorBanner message={actionError} /></div>}
      </div>

      {/* Existing notes */}
      {notes.length === 0 ? (
        <EmptyPanel icon={<ClipboardList size={28} />} title="No notes yet" description="Upload an audio file above to generate transcription notes." />
      ) : (
        notes.map((note) => (
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
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Transcript Sources ({note.segments.length} segments)
                </p>
                <CitationList
                  id={`note-citations-${note.id}`}
                  variant="stacked"
                  citations={note.segments.map((seg, i) => ({
                    id: `${note.id}-seg-${i}`,
                    title: `${seg.speaker} — ${seg.timestamp}`,
                    domain: 'transcript',
                    href: `https://mednemo.local/transcript/${note.id}#seg-${i}`,
                    type: 'document' as const,
                    snippet: seg.text,
                  }))}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}


function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
      <AlertCircle size={16} className="shrink-0" /> {message}
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

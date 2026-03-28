'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Mic,
  MicOff,
  FileText,
  ClipboardList,
  Sparkles,
  Download,
  Brain,
  ChevronLeft,
  Bell,
  LayoutDashboard,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Trash2,
  Upload,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';
import { useChatPanel } from '@/components/chat';
import PatientChat from '@/components/chat/PatientChat';
import ResizableChatPanel from '@/components/chat/ResizableChatPanel';
import { MedMemoLogo } from '@/components/MedMemoLogo';
import { PatientAvatar } from '@/components/PatientAvatar';
import { StatsDisplay } from '@/components/tool-ui/stats-display/stats-display';
import { DataTable } from '@/components/tool-ui/data-table/data-table';
import { ProgressTracker } from '@/components/tool-ui/progress-tracker/progress-tracker';
import { CitationList } from '@/components/tool-ui/citation/citation-list';
import {
  fetchUser,
  fetchDocumentsForUser,
  fetchNotesForUser,
  type Patient,
  type Document,
  type Note,
} from '@/lib/supabase';
import {
  apiGetSessions,
  apiCreateSession,
  apiIngestFiles,
  apiDeleteDocument,
  apiUploadAudio,
  apiTranscribe,
  type ApiSession,
  type IngestResult,
} from '@/lib/api';

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'notes'>('overview');
  const [user, setUser] = useState<Patient | null>(null);
  const [userSessions, setUserSessions] = useState<ApiSession[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const { setContext } = useChatPanel();

  useEffect(() => {
    if (id) loadPatientData(id as string);
  }, [id]);

  // Update global chat context when patient loads
  useEffect(() => {
    if (user) {
      setContext({ page: 'patient', patientId: user.id, patientName: user.external_id });
    }
    return () => setContext({ page: 'home' });
  }, [user, setContext]);

  async function loadPatientData(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const [userData, docsData, notesData] = await Promise.all([
        fetchUser(userId),
        fetchDocumentsForUser(userId),
        fetchNotesForUser(userId),
      ]);
      let sessionsData = await apiGetSessions(userData.external_id);
      if (sessionsData.length === 0) {
        await apiCreateSession(userData.external_id, userData.external_id);
        sessionsData = await apiGetSessions(userData.external_id);
      }
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
            <MedMemoLogo size={32} />
            <span className="text-lg font-bold tracking-tight">MedMemo</span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={false} onClick={() => router.push('/dashboard')} />
          <NavItem icon={<User size={16} />} label="Patients" active={true} onClick={() => {}} />
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/chat"
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-ring"
            aria-label="Open full AI chat"
            title="Open full chat"
          >
            <Sparkles size={20} />
          </Link>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors focus-ring hidden lg:flex ${showChat ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            aria-label={showChat ? 'Hide sidebar chat' : 'Show sidebar chat'}
            aria-pressed={showChat}
          >
            {showChat ? <span className="text-xs font-medium">Hide Chat</span> : <span className="text-xs font-medium">Show Chat</span>}
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
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center gap-2 text-sm">
                  <li><button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-700 focus-ring rounded px-1 transition-colors font-medium">Dashboard</button></li>
                  <li aria-hidden="true" className="text-slate-300">/</li>
                  <li className="text-blue-600 font-semibold" aria-current="page">{user.external_id}</li>
                </ol>
              </nav>

              {/* Patient header */}
              <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                <PatientAvatar name={user.external_id} size="lg" />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">{user.external_id}</h1>
                  <p className="text-sm text-slate-500 font-medium">
                    🩺 Patient since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Tab bar */}
              <div role="tablist" aria-label="Patient sections" className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    aria-controls={`panel-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap focus-ring relative ${
                      activeTab === tab.key
                        ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-blue-600'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span aria-hidden="true" className={`text-base ${activeTab === tab.key ? 'text-blue-600' : 'text-slate-400'}`}>{tab.icon}</span>
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

        {/* Right Sidebar — Resizable Patient Chat */}
        {showChat && user && (
          <ResizableChatPanel defaultWidth={380} minWidth={300} maxWidth={600}>
            <PatientChat patientName={user.external_id} patientId={user.id} />
          </ResizableChatPanel>
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

function OverviewPanel({ user, sessions, documents, notes }: { user: Patient; sessions: ApiSession[]; documents: Document[]; notes: Note[] }) {
  // Stats for StatsDisplay component
  const stats = [
    { key: 'chats', label: 'Chats', value: sessions.length, format: { kind: 'number' as const } },
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

      {/* Chats Table — tool-ui component */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Chats</h3>
          <DataTable
            id="patient-chats"
            columns={[
              { key: 'name', label: 'Chat Name', priority: 'primary' },
              { key: 'created', label: 'Created' },
              { key: 'updated', label: 'Last Updated' },
            ]}
            data={sessionTableData}
            emptyMessage="No chats yet."
          />
        </div>
      )}
    </div>
  );
}

function DocumentsPanel({ documents, sessions, user, reload }: { documents: Document[]; sessions: ApiSession[]; user: Patient; reload: () => void }) {
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

  const [dragOver, setDragOver] = useState(false);
  const selectedFiles = fileRef.current?.files;
  const fileCount = selectedFiles?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Upload section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Upload size={15} className="text-blue-600" />
          Upload Documents
        </h3>
        {!sessionId ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" /> Loading session…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (fileRef.current && e.dataTransfer.files.length > 0) {
                  fileRef.current.files = e.dataTransfer.files;
                  // trigger re-render
                  fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
              aria-label="Drop files here or click to browse"
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50/60'
                  : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Upload size={18} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {fileCount > 0
                    ? `${fileCount} file${fileCount > 1 ? 's' : ''} selected`
                    : 'Drop files here or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpeg,.jpg,.png"
              multiple
              className="hidden"
              onChange={() => {
                // force re-render for file count
                setDragOver(false);
              }}
              aria-label="Select files"
            />

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading || fileCount === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Upload & Ingest
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {uploadResults && (
          <div className="mt-4 space-y-2">
            {uploadResults.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 text-sm px-3 py-2.5 rounded-lg ${
                  r.status === 'error'
                    ? 'text-red-700 bg-red-50 border border-red-100'
                    : 'text-green-700 bg-green-50 border border-green-100'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {r.status === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.file_name}</p>
                  <p className="text-xs opacity-80">{r.status === 'error' ? r.error : `${r.pages_ingested} pages ingested`}</p>
                </div>
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-25 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Documents</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 font-semibold text-slate-700">File Name</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-700">Type</th>
                <th className="text-center px-6 py-3 font-semibold text-slate-700">Pages</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-blue-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-700">{d.file_name}</td>
                  <td className="px-6 py-4 text-slate-600"><span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{d.file_type.toUpperCase()}</span></td>
                  <td className="px-6 py-4 text-center tabular-nums text-slate-600">{d.pages_ingested}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${d.status === 'ingested' ? 'bg-green-50 text-green-700' : d.status === 'processing' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{d.status}</span></td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteDoc(d)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" aria-label={`Delete ${d.file_name}`}>
                      <Trash2 size={16} />
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

function NotesPanel({ notes, sessions, user, reload }: { notes: Note[]; sessions: ApiSession[]; user: Patient; reload: () => void }) {
  const sessionId = sessions[0]?.id ?? null;
  const [step, setStep] = useState<'idle' | 'uploading' | 'transcribing'>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDragOver, setAudioDragOver] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function runUploadAndTranscribe(file: File) {
    if (!sessionId) return;
    setActionError(null);
    setSuccess(false);
    try {
      setStep('uploading');
      const uploadRes = await apiUploadAudio(file, user.external_id, sessionId);
      setStep('transcribing');
      await apiTranscribe(uploadRes.storage_path, user.external_id, sessionId, file.type || 'audio/webm');
      setSuccess(true);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setStep('idle');
    }
  }

  async function handleUploadAndTranscribe() {
    const file = audioRef.current?.files?.[0];
    if (!file || !sessionId) return;
    if (audioRef.current) audioRef.current.value = '';
    await runUploadAndTranscribe(file);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setIsRecording(false);
        setRecSeconds(0);
        await runUploadAndTranscribe(file);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      setActionError('Microphone access denied. Please allow mic access and try again.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload audio section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Mic size={14} /> Record / Upload Audio</h3>

        {/* Live Record Button */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={step !== 'idle'}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all focus-ring disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
            )}
            {isRecording ? <MicOff size={32} className="text-white relative z-10" /> : <Mic size={32} className="text-white relative z-10" />}
          </button>
          <div className="text-center">
            {isRecording ? (
              <p className="text-sm font-semibold text-red-600">Recording… {formatTime(recSeconds)}</p>
            ) : step !== 'idle' ? (
              <p className="text-sm font-medium text-blue-600 flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />{step === 'uploading' ? 'Uploading…' : 'Transcribing…'}</p>
            ) : (
              <p className="text-sm text-slate-500">Tap to record a session</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-slate-400 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span>or upload a file</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Audio file drop zone */}
        {!sessionId ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" /> Loading session…
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              onClick={() => audioRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setAudioDragOver(true); }}
              onDragLeave={() => setAudioDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setAudioDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('audio/')) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  if (audioRef.current) { audioRef.current.files = dt.files; }
                  setAudioFileName(file.name);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') audioRef.current?.click(); }}
              aria-label="Drop audio file here or click to browse"
              className={`flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 cursor-pointer transition-all ${
                audioDragOver
                  ? 'border-blue-400 bg-blue-50/60'
                  : audioFileName
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${audioFileName ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Upload size={15} />
              </div>
              <div className="flex-1 min-w-0">
                {audioFileName ? (
                  <p className="text-sm font-medium text-slate-800 truncate">{audioFileName}</p>
                ) : (
                  <p className="text-sm text-slate-500">Drop audio file or <span className="text-blue-600 font-medium">browse</span></p>
                )}
                <p className="text-[11px] text-slate-400 mt-0.5">MP3, WAV, WebM, M4A</p>
              </div>
              {audioFileName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioFileName(null);
                    if (audioRef.current) audioRef.current.value = '';
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus-ring"
                  aria-label="Remove selected file"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              ref={audioRef}
              type="file"
              accept="audio/*"
              className="hidden"
              aria-label="Select audio file"
              onChange={() => {
                const name = audioRef.current?.files?.[0]?.name;
                setAudioFileName(name || null);
              }}
            />
            <button
              onClick={handleUploadAndTranscribe}
              disabled={step !== 'idle' || isRecording || !audioFileName}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
            >
              {step !== 'idle' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {step === 'uploading' ? 'Uploading…' : 'Transcribing…'}
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Upload & Transcribe
                </>
              )}
            </button>
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
            <CheckCircle2 size={15} /> Transcription complete! Note added.
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
                <Brain size={16} className="text-blue-600" aria-hidden="true" />
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
                    href: `https://medmemo.local/transcript/${note.id}#seg-${i}`,
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

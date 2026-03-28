'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  LayoutDashboard,
  User,
  Bell,
  CheckCircle2,
  Info,
  MoreHorizontal,
  AlertCircle,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { StatsDisplay } from '@/components/tool-ui/stats-display/stats-display';
import { fetchUsers, fetchSessions, createUser, type Patient, type Session } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
      // Fetch sessions for each user
      const sessionsMap: Record<string, Session[]> = {};
      await Promise.all(
        usersData.map(async (u) => {
          try {
            sessionsMap[u.id] = await fetchSessions(u.id);
          } catch {
            sessionsMap[u.id] = [];
          }
        })
      );
      setSessions(sessionsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.external_id.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
          <div
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            aria-hidden="true"
          >
            +
          </div>
          <span className="text-lg font-bold tracking-tight">MedNemo</span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200"
        >
          <NavItem
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            active={true}
            onClick={() => router.push('/')}
          />
          <NavItem
            icon={<User size={16} />}
            label="Patients"
            active={false}
            onClick={() => router.push('/')}
          />
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-ring"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="sr-only">3 unread notifications</span>
          </button>
          <div
            className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm"
            role="img"
            aria-label="User avatar"
          >
            Dr
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Manage and view patient records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search patients…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search patients"
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 transition-shadow"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors focus-ring shrink-0"
                aria-label="Add new patient"
              >
                <Plus size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Add Patient</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          {!loading && !error && users.length > 0 && (
            <div className="mb-6">
              <StatsDisplay
                id="dashboard-stats"
                className="w-full"
                stats={[
                  {
                    key: 'total-patients',
                    label: 'Total Patients',
                    value: users.length,
                    format: { kind: 'number' },
                  },
                  {
                    key: 'total-sessions',
                    label: 'Total Sessions',
                    value: Object.values(sessions).reduce((sum, s) => sum + s.length, 0),
                    format: { kind: 'number' },
                  },
                  {
                    key: 'active-today',
                    label: 'Active Today',
                    value: Object.values(sessions).filter((s) =>
                      s.some((sess) => new Date(sess.updated_at).toDateString() === new Date().toDateString())
                    ).length,
                    format: { kind: 'number' },
                  },
                ]}
              />
            </div>
          )}

          {/* States: loading, error, empty, content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading patients">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="skeleton h-4 w-2/3 mb-4" />
                  <div className="skeleton h-3 w-1/2 mb-3" />
                  <div className="skeleton h-3 w-1/3 mb-3" />
                  <div className="skeleton h-10 w-full mt-4" />
                </div>
              ))}
              <span className="sr-only">Loading patient data…</span>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Failed to load patients
              </h2>
              <p className="text-sm text-slate-600 mb-4 max-w-md">{error}</p>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 focus-ring transition-colors"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Users size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No patients found' : 'No patients yet'}
              </h2>
              <p className="text-sm text-slate-600 max-w-md">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'Add your first patient to get started.'}
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label="Patient list"
            >
              {filteredUsers.map((user) => (
                <PatientCard
                  key={user.id}
                  user={user}
                  sessionCount={sessions[user.id]?.length ?? 0}
                  latestSession={sessions[user.id]?.[0] ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function AddPatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = patientId.trim();
    if (!trimmed) return;

    setSaving(true);
    setModalError(null);
    try {
      await createUser(trimmed);
      onCreated();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add new patient"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Add New Patient</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-ring"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="patient-id"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Patient ID
            </label>
            <input
              ref={inputRef}
              id="patient-id"
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. john.doe@email.com or patient name"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400"
              required
              disabled={saving}
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              This is the unique identifier for the patient (email, name, or MRN).
            </p>
          </div>

          {/* Error */}
          {modalError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-ring disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !patientId.trim()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus size={14} aria-hidden="true" />
                  Add Patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function PatientCard({
  user,
  sessionCount,
  latestSession,
}: {
  user: Patient;
  sessionCount: number;
  latestSession: Session | null;
}) {
  const router = useRouter();

  const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      role="listitem"
      tabIndex={0}
      onClick={() => router.push(`/patient/${user.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/patient/${user.id}`);
        }
      }}
      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer focus-ring group"
      aria-label={`Patient ${user.external_id}, ${sessionCount} sessions`}
    >
      {/* Top row: avatar + name */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
            {user.external_id.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              {user.external_id}
            </h2>
            <p className="text-xs text-slate-600">
              Joined {createdDate}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-ring"
          aria-label={`More options for ${user.external_id}`}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-700">
            {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        {latestSession && (
          <span className="text-xs text-slate-500">
            Latest: {latestSession.name}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/patient/${user.id}`);
          }}
          className="flex-1 bg-slate-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-800 active:bg-slate-950 transition-colors text-sm py-2.5 focus-ring"
        >
          <Info size={14} aria-hidden="true" />
          View Details
        </button>
      </div>
    </article>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Brain,
  FileText,
  Mic,
  Sparkles,
  Zap,
  Lock,
  Activity,
} from 'lucide-react';
import { StatsDisplay } from '@/components/tool-ui/stats-display/stats-display';
import { ProgressTracker } from '@/components/tool-ui/progress-tracker/progress-tracker';
import { CitationList } from '@/components/tool-ui/citation/citation-list';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white" aria-hidden="true">
              <Sparkles size={16} />
            </div>
            <span className="text-lg font-bold tracking-tight">MedNemo</span>
          </div>
          <nav aria-label="Landing navigation" className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus-ring rounded px-1">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus-ring rounded px-1">How it works</a>
            <a href="#demo" className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus-ring rounded px-1">Demo</a>
          </nav>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 active:bg-slate-950 transition-colors focus-ring"
          >
            Open App
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
              <Zap size={12} aria-hidden="true" />
              AI-Powered Medical Records Assistant
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Your patients&apos; history,<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                always remembered.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              MedNemo uses AI to ingest, organize, and recall medical records instantly.
              Upload documents, record sessions, and ask questions — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors focus-ring shadow-lg shadow-blue-500/25"
              >
                Get Started
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="#demo"
                className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-full text-base font-medium hover:bg-slate-50 border border-slate-200 transition-colors focus-ring"
              >
                See it in action
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Demo — StatsDisplay */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <StatsDisplay
            id="hero-stats"
            title="Platform Overview"
            description="Real-time metrics from MedNemo"
            stats={[
              {
                key: 'patients',
                label: 'Active Patients',
                value: 1284,
                format: { kind: 'number', compact: true },
                diff: { value: 12.4, label: 'vs last month' },
                sparkline: { data: [40, 55, 48, 72, 65, 80, 95, 110, 102, 120], color: '#2563eb' },
              },
              {
                key: 'documents',
                label: 'Documents Processed',
                value: 8429,
                format: { kind: 'number', compact: true },
                diff: { value: 23.1, label: 'vs last month' },
                sparkline: { data: [200, 310, 280, 420, 380, 510, 490, 620, 580, 700], color: '#059669' },
              },
              {
                key: 'sessions',
                label: 'Voice Sessions',
                value: 3156,
                format: { kind: 'number', compact: true },
                diff: { value: 8.7, label: 'vs last month' },
                sparkline: { data: [80, 95, 110, 88, 120, 135, 125, 150, 140, 165], color: '#7c3aed' },
              },
              {
                key: 'accuracy',
                label: 'Retrieval Accuracy',
                value: 0.967,
                format: { kind: 'percent', decimals: 1, basis: 'fraction' },
                diff: { value: 2.3, label: 'improvement' },
                sparkline: { data: [91, 92, 93, 92.5, 94, 94.5, 95, 95.5, 96, 96.7], color: '#0891b2' },
              },
            ]}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">A complete AI toolkit for modern medical practice.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard icon={<FileText size={22} />} color="blue" title="Document Ingestion" description="Upload PDFs, images, and lab results. AI extracts and indexes all medical data automatically." />
          <FeatureCard icon={<Mic size={22} />} color="purple" title="Voice Sessions" description="Record patient sessions. Real-time transcription with AI-generated SOAP notes." />
          <FeatureCard icon={<Brain size={22} />} color="indigo" title="Smart Retrieval (RAG)" description="Ask natural language questions about any patient's history. Answers cite source documents." />
          <FeatureCard icon={<Shield size={22} />} color="emerald" title="Privacy First" description="All data encrypted at rest and in transit. HIPAA-ready architecture with role-based access." />
          <FeatureCard icon={<Activity size={22} />} color="cyan" title="Real-time Insights" description="Track trends, flag anomalies, and surface relevant history before each visit." />
          <FeatureCard icon={<Lock size={22} />} color="amber" title="Audit Trail" description="Every query, document, and interaction is logged for full compliance." />
        </div>
      </section>

      {/* How It Works — ProgressTracker */}
      <section id="how-it-works" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">From upload to insight in minutes.</p>
          </div>
          <div className="max-w-lg mx-auto">
            <ProgressTracker
              id="how-it-works-tracker"
              steps={[
                { id: 'upload', label: 'Upload Documents', description: 'Drop PDFs, images, or lab results. Supports any medical format.', status: 'completed' },
                { id: 'process', label: 'AI Processing', description: 'OCR extraction, entity recognition, and vector embedding — all automatic.', status: 'completed' },
                { id: 'index', label: 'Smart Indexing', description: 'Data is chunked and indexed for lightning-fast semantic search.', status: 'completed' },
                { id: 'query', label: 'Ask Anything', description: 'Natural language questions with cited, source-backed answers.', status: 'in-progress' },
              ]}
              elapsedTime={4.2}
            />
          </div>
        </div>
      </section>

      {/* Source Citations Demo — CitationList */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Every answer has a source</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            MedNemo cites every document it references — fully traceable, fully auditable.
          </p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-500 mb-2">AI Response</p>
            <p className="text-base text-slate-800 leading-relaxed">
              Based on the lab results from October 2025, Curtis&apos;s glucose level was <strong>95 mg/dL</strong> (normal range).
              His cholesterol has improved by 12% compared to the previous test in July.
              The attending physician noted mild hypertension requiring continued monitoring.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sources</p>
            <CitationList
              id="demo-citations"
              variant="default"
              citations={[
                { id: '1', title: 'Blood Test Results — Oct 2025', domain: 'lab-reports', href: 'https://example.com/lab/oct2025', type: 'document', snippet: 'Complete blood panel showing glucose, cholesterol, and metabolic markers.' },
                { id: '2', title: 'Blood Test Results — Jul 2025', domain: 'lab-reports', href: 'https://example.com/lab/jul2025', type: 'document', snippet: 'Previous blood panel for trend comparison.' },
                { id: '3', title: 'Clinical Notes — Dr. Patel', domain: 'clinical-notes', href: 'https://example.com/notes/patel', type: 'document', snippet: 'Physician notes on hypertension management plan.' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
            Set up MedNemo in minutes. Add your first patient and start building their medical memory.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-blue-500 transition-colors focus-ring shadow-lg shadow-blue-500/30"
          >
            Open Dashboard
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white" aria-hidden="true">
              <Sparkles size={12} />
            </div>
            <span className="text-sm font-semibold text-slate-900">MedNemo</span>
          </div>
          <p className="text-xs text-slate-500">Built with Railtracks, Supabase, and Next.js. Privacy-first by design.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function FeatureCard({ icon, color, title, description }: { icon: React.ReactNode; color: string; title: string; description: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

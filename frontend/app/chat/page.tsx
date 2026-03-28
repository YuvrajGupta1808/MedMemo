'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import {
  ArrowUp,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileText,
  Trash2,
  ChevronLeft,
  Sparkles,
  Upload,
  Search,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { MedMemoLogo } from '@/components/MedMemoLogo';
import { useChatPanel, type ChatAttachment } from '@/components/chat/ChatProvider';

export default function ChatPage() {
  const { attachments, addAttachment, removeAttachment, clearAttachments } = useChatPanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
  });

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(addAttachment);
  }, [addAttachment]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) addAttachment(file);
      }
    }
  }, [addAttachment]);

  const toggleRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        addAttachment(new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch { /* mic denied */ }
  }, [isRecording, mediaRecorder, addAttachment]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    handleSubmit(e);
    clearAttachments();
  };

  const suggestions = [
    { label: 'Summarize a patient', prompt: 'Summarize all records for patient ', icon: User },
    { label: 'Upload & analyze', prompt: '', icon: Upload },
    { label: 'Find lab results', prompt: 'Find recent lab results for ', icon: Search },
    { label: 'Start voice session', prompt: '', icon: Mic },
  ];

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Minimal nav */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-ring"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <MedMemoLogo size={28} />
            <span className="text-sm font-semibold text-slate-900">MedMemo AI</span>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 size={14} className="animate-spin" />
            Thinking…
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasMessages ? (
          /* ── Empty state: centered hero ── */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <MedMemoLogo size={56} className="rounded-2xl mb-5" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1.5 text-center">
              What can I help with?
            </h1>
            <p className="text-sm text-slate-400 mb-8 text-center max-w-sm">
              Ask about patients, upload documents, or record a session.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm w-full mb-10">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => {
                      if (s.label === 'Upload & analyze') fileInputRef.current?.click();
                      else if (s.label === 'Start voice session') toggleRecording();
                      else { setInput(s.prompt); inputRef.current?.focus(); }
                    }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-600 rounded-xl border border-slate-150 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 transition-all focus-ring"
                  >
                    <Icon size={15} className="text-slate-400 shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Messages area ── */
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar" role="log" aria-label="Chat messages" aria-live="polite">
            <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 mr-3" aria-hidden="true">
                      <Sparkles size={13} />
                    </div>
                  )}
                  <div className={`max-w-[80%] text-[15px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-slate-100 text-slate-900 px-4 py-3 rounded-3xl rounded-br-lg'
                      : 'text-slate-800'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0" aria-hidden="true">
                    <Sparkles size={13} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Attachments preview ── */}
        {attachments.length > 0 && (
          <div className="max-w-2xl mx-auto w-full px-4 py-2 flex gap-2 overflow-x-auto">
            {attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} onRemove={() => removeAttachment(att.id)} />
            ))}
          </div>
        )}

        {/* ── Input bar (Gemini style — bottom, centered, rounded) ── */}
        <div className="w-full border-t border-slate-100 bg-white pb-4 pt-3 px-4">
          <form onSubmit={onSubmit} onPaste={handlePaste} className="max-w-2xl mx-auto">
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(addAttachment); e.target.value = ''; }} aria-label="Upload files" />
            <div className={`flex items-end gap-2 rounded-3xl border px-4 py-2.5 transition-shadow ${isRecording ? 'border-red-300 ring-2 ring-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400 focus-within:bg-white'}`}>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors focus-ring shrink-0" aria-label="Attach file">
                <Paperclip size={18} />
              </button>
              <textarea
                ref={inputRef}
                placeholder={isRecording ? 'Recording audio…' : 'Ask MedMemo anything…'}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
                rows={1}
                disabled={isRecording}
                aria-label="Message"
                className="flex-1 bg-transparent border-none focus:outline-none text-[15px] py-1.5 max-h-40 resize-none custom-scrollbar text-slate-800 placeholder:text-slate-400 min-h-[32px] disabled:opacity-50"
              />
              <button type="button" onClick={toggleRecording} className={`p-2 rounded-xl transition-colors focus-ring shrink-0 ${isRecording ? 'text-red-600 bg-red-100 hover:bg-red-200 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'}`} aria-label={isRecording ? 'Stop recording' : 'Start voice recording'} aria-pressed={isRecording}>
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="w-9 h-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 focus-ring" aria-label="Send">
                <ArrowUp size={18} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Drop files · paste images · <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">🎙️</kbd> voice
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Attachment Chip ── */
function AttachmentChip({ attachment, onRemove }: { attachment: ChatAttachment; onRemove: () => void }) {
  const styles = {
    image: 'bg-blue-50 text-blue-600 border-blue-200',
    document: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    audio: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  const icons = {
    image: <ImageIcon size={14} />,
    document: <FileText size={14} />,
    audio: <Mic size={14} />,
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium shrink-0 ${styles[attachment.type]}`}>
      {attachment.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.preview} alt="" className="w-6 h-6 rounded-md object-cover" />
      ) : icons[attachment.type]}
      <span className="max-w-[80px] truncate">{attachment.file.name}</span>
      <button onClick={onRemove} className="p-0.5 hover:bg-white/60 rounded transition-colors focus-ring" aria-label={`Remove ${attachment.file.name}`}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

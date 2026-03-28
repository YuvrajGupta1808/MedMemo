'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import {
  Sparkles,
  ArrowUp,
  Loader2,
  X,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileText,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useChatPanel, type ChatAttachment } from './ChatProvider';

export default function GlobalChat() {
  const { isOpen, close, context, attachments, addAttachment, removeAttachment, clearAttachments } = useChatPanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [expanded, setExpanded] = useState(false);

  const systemPrompt = context.patientName
    ? `You are MedNemo, an AI medical assistant. You are currently viewing patient: ${context.patientName} (ID: ${context.patientId}). Help with their records, documents, sessions, and medical queries. Be professional, cite sources when possible.`
    : `You are MedNemo, an AI medical assistant. Help healthcare providers manage patient records, upload documents, and query medical history. Be professional and concise.`;

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
    body: { context },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: context.patientName
          ? `Hi! I'm ready to help with **${context.patientName}**'s records. You can ask questions, upload documents, or record a session.`
          : `Hi! I'm your MedNemo assistant. Ask me anything, upload documents, or start a voice session.`,
      },
    ],
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(addAttachment);
  }, [addAttachment]);

  // Handle paste (images)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) addAttachment(file);
      }
    }
  }, [addAttachment]);

  // Voice recording
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
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        addAttachment(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      // Mic permission denied — silently fail
    }
  }, [isRecording, mediaRecorder, addAttachment]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    // TODO: In production, send attachments to backend via FormData
    handleSubmit(e);
    clearAttachments();
  };

  // Quick action chips
  const quickActions = context.patientName
    ? [
        { label: '📄 Upload document', action: () => fileInputRef.current?.click() },
        { label: '🎙️ Record session', action: toggleRecording },
        { label: '🔍 Search records', action: () => { setInput('Search all records for '); inputRef.current?.focus(); } },
        { label: '📋 Generate summary', action: () => { setInput(`Generate a summary for ${context.patientName}`); inputRef.current?.focus(); } },
      ]
    : [
        { label: '👤 Add patient', action: () => { setInput('Create a new patient with ID '); inputRef.current?.focus(); } },
        { label: '📄 Upload document', action: () => fileInputRef.current?.click() },
        { label: '🎙️ Record session', action: toggleRecording },
      ];

  if (!isOpen) return null;

  const panelWidth = expanded ? 'w-full sm:w-[600px]' : 'w-full sm:w-[420px]';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none" onClick={close} aria-hidden="true" />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        className={`fixed right-0 top-0 bottom-0 ${panelWidth} z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out`}
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 bg-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0" aria-hidden="true">
            <Sparkles size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate">MedNemo AI</h2>
            <p className="text-xs text-slate-600 truncate">
              {isRecording ? '🔴 Recording…' : isLoading ? 'Thinking…' : context.patientName ? `Viewing ${context.patientName}` : 'Ready to help'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(!expanded)} className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-ring" aria-label={expanded ? 'Collapse panel' : 'Expand panel'}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={close} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-ring" aria-label="Close assistant">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 active:bg-slate-300 transition-colors focus-ring"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">How can I help?</p>
              <p className="text-xs text-slate-600">Ask questions, upload files, or record audio.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
            {attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} onRemove={() => removeAttachment(att.id)} />
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={onSubmit} className="px-4 pb-4 pt-2 border-t border-slate-200 bg-white shrink-0" onPaste={handlePaste}>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(addAttachment); e.target.value = ''; }} aria-label="Upload files" />
          <div className={`flex items-end gap-1.5 bg-slate-50 border rounded-2xl p-2 transition-shadow ${isRecording ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'}`}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors focus-ring shrink-0" aria-label="Attach file">
              <Paperclip size={16} />
            </button>
            <textarea
              ref={inputRef}
              placeholder={isRecording ? 'Recording audio…' : context.patientName ? `Ask about ${context.patientName}…` : 'Ask anything…'}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
              rows={1}
              disabled={isRecording}
              aria-label="Message input"
              className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 px-1 max-h-32 resize-none custom-scrollbar text-slate-800 placeholder:text-slate-500 min-h-[36px] disabled:opacity-50"
            />
            <button type="button" onClick={toggleRecording} className={`p-2 rounded-lg transition-colors focus-ring shrink-0 ${isRecording ? 'text-red-600 bg-red-50 hover:bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`} aria-label={isRecording ? 'Stop recording' : 'Start voice recording'} aria-pressed={isRecording}>
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 focus-ring" aria-label="Send message">
              <ArrowUp size={16} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Drop files, paste images, or use 🎙️ to record · <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Esc</kbd> to close
          </p>
        </form>
      </aside>
    </>
  );
}


function AttachmentPreview({ attachment, onRemove }: { attachment: ChatAttachment; onRemove: () => void }) {
  const iconMap = {
    image: <ImageIcon size={14} />,
    document: <FileText size={14} />,
    audio: <Mic size={14} />,
  };
  const colorMap = {
    image: 'bg-blue-50 text-blue-600 border-blue-200',
    document: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    audio: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 ${colorMap[attachment.type]}`}>
      {attachment.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.preview} alt={attachment.file.name} className="w-8 h-8 rounded-lg object-cover" />
      ) : (
        iconMap[attachment.type]
      )}
      <span className="max-w-[100px] truncate">{attachment.file.name}</span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-white/50 rounded transition-colors focus-ring"
        aria-label={`Remove ${attachment.file.name}`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

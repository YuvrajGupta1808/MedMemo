'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRailtracksChat } from '@/hooks/useRailtracksChat';
import {
  ArrowUp,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileText,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useChatPanel, type ChatAttachment } from './ChatProvider';
import { ToolCallRenderer } from './tools/ToolCallRenderer';

interface PatientChatProps {
  patientName: string;
  patientId: string;
  sessionId?: string;
}

export default function PatientChat({ patientName, patientId, sessionId }: PatientChatProps) {
  const { attachments, addAttachment, removeAttachment, clearAttachments } = useChatPanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, isConnected } = useRailtracksChat({
    agentUrl: process.env.NEXT_PUBLIC_AGENT_GLOBAL_URL ?? 'http://localhost:7001',
    context: { patientId, patientName, sessionId },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full bg-white" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0" aria-hidden="true">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">AI Assistant</h2>
          <p className="text-xs text-slate-500 truncate">
            {isRecording ? '🔴 Recording…' : isLoading ? 'Thinking…' : `Viewing ${patientName}`}
          </p>
          {!isConnected && (
            <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">Disconnected</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar" role="log" aria-label="Chat messages" aria-live="polite">
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5" aria-hidden="true">
                  <Sparkles size={11} />
                </div>
              )}
              <div className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-2xl rounded-br-md'
                  : 'bg-slate-50 text-slate-800 rounded-2xl rounded-bl-md border border-slate-100'
              }`}>
                {m.content}
              {(m as any).toolInvocations?.map((inv: any) => (
                <div key={inv.toolCallId} className="mt-2">
                  <ToolCallRenderer invocation={inv} />
                </div>
              ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0" aria-hidden="true">
                <Sparkles size={11} />
              </div>
              <div className="bg-slate-50 text-slate-500 rounded-2xl rounded-bl-md border border-slate-100 px-3.5 py-2.5 text-[13px] flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
          {attachments.map((att) => (
            <div key={att.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 ${
              att.type === 'image' ? 'bg-blue-50 text-blue-600 border-blue-200' :
              att.type === 'audio' ? 'bg-purple-50 text-purple-600 border-purple-200' :
              'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              {att.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.preview} alt="" className="w-6 h-6 rounded object-cover" />
              ) : att.type === 'image' ? <ImageIcon size={14} /> : att.type === 'audio' ? <Mic size={14} /> : <FileText size={14} />}
              <span className="max-w-[80px] truncate">{att.file.name}</span>
              <button onClick={() => removeAttachment(att.id)} className="p-0.5 hover:bg-white/50 rounded transition-colors focus-ring" aria-label={`Remove ${att.file.name}`}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} onPaste={handlePaste} className="px-4 pb-4 pt-2 border-t border-slate-200 bg-white shrink-0">
        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(addAttachment); e.target.value = ''; }} aria-label="Upload files" />
        <div className={`flex items-end gap-1.5 rounded-2xl border p-2 transition-shadow ${isRecording ? 'border-red-300 ring-2 ring-red-100 bg-red-50/30' : 'bg-slate-50 border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'}`}>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors focus-ring shrink-0" aria-label="Attach file">
            <Paperclip size={16} />
          </button>
          <textarea
            ref={inputRef}
            placeholder={isRecording ? 'Recording…' : `Ask about ${patientName}…`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
            rows={1}
            disabled={isRecording}
            aria-label={`Message about ${patientName}`}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 px-1 max-h-32 resize-none custom-scrollbar text-slate-800 placeholder:text-slate-500 min-h-[36px] disabled:opacity-50"
          />
          <button type="button" onClick={toggleRecording} className={`p-2 rounded-lg transition-colors focus-ring shrink-0 ${isRecording ? 'text-red-600 bg-red-50 hover:bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`} aria-label={isRecording ? 'Stop recording' : 'Start voice recording'} aria-pressed={isRecording}>
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 focus-ring" aria-label="Send message">
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

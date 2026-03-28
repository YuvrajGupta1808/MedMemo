'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import {
  Sparkles,
  ArrowUp,
  Loader2,
} from 'lucide-react';

interface ChatbotProps {
  patientName: string;
}

export default function Chatbot({ patientName }: ChatbotProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your MedNemo assistant. How can I help you with **${patientName}'s** records today?`,
      },
    ],
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3 bg-white shrink-0">
        <div
          className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"
          aria-hidden="true"
        >
          <Sparkles size={14} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>
          <p className="text-xs text-slate-600">
            {isLoading ? 'Thinking…' : 'Ready to help'}
          </p>
        </div>
        {isLoading && (
          <Loader2 size={16} className="ml-auto text-blue-600 animate-spin" aria-label="Loading" />
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">No messages yet</p>
            <p className="text-xs text-slate-600">
              Ask me anything about {patientName}&apos;s medical history.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Thinking…
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-2 border-t border-slate-200 bg-white shrink-0"
      >
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
          <textarea
            ref={inputRef}
            placeholder={`Ask about ${patientName}…`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            rows={1}
            aria-label={`Message about ${patientName}`}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 px-2 max-h-32 resize-none custom-scrollbar text-slate-800 placeholder:text-slate-500 min-h-[40px]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 focus-ring"
            aria-label="Send message"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useChatPanel } from './ChatProvider';

export default function ChatTrigger() {
  const { isOpen, toggle } = useChatPanel();

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 focus-ring ${
        isOpen
          ? 'bg-slate-900 text-white hover:bg-slate-800 rotate-0 shadow-slate-900/25'
          : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
      }`}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      aria-expanded={isOpen}
    >
      {isOpen ? <X size={20} /> : <Sparkles size={20} />}
    </button>
  );
}

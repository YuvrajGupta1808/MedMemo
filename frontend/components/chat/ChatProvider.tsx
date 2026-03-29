'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ChatContext {
  page: string;
  patientId?: string;
  patientName?: string;
}

interface ChatProviderValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  context: ChatContext;
  setContext: (ctx: ChatContext) => void;
  // Attachments queue
  attachments: ChatAttachment[];
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export interface ChatAttachment {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'audio';
}

const ChatCtx = createContext<ChatProviderValue | null>(null);

export function useChatPanel() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChatPanel must be used within <ChatProvider>');
  return ctx;
}

function getAttachmentType(file: File): ChatAttachment['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ChatContext>({ page: 'home' });
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const addAttachment = useCallback((file: File) => {
    const type = getAttachmentType(file);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let preview: string | undefined;
    if (type === 'image') {
      preview = URL.createObjectURL(file);
    }
    setAttachments((prev) => [...prev, { id, file, preview, type }]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => { if (a.preview) URL.revokeObjectURL(a.preview); });
      return [];
    });
  }, []);

  return (
    <ChatCtx.Provider
      value={{ isOpen, open, close, toggle, context, setContext, attachments, addAttachment, removeAttachment, clearAttachments }}
    >
      {children}
    </ChatCtx.Provider>
  );
}

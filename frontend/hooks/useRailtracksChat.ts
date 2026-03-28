'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RailtracksMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  toolInvocations?: RailtracksToolInvocation[];
}

export interface RailtracksToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  success?: boolean;
  state: 'call' | 'result';
}

interface UseRailtracksChatOptions {
  /** Direct agent URL (e.g. 'http://localhost:7001') — used for both POST and SSE */
  agentUrl: string;
  /** @deprecated No longer used — POST goes directly to agentUrl */
  apiEndpoint?: string;
  /** Optional context to include with every message (e.g. patientId, sessionId) */
  context?: Record<string, unknown>;
}

export function useRailtracksChat({ agentUrl, context }: UseRailtracksChatOptions) {
  const [messages, setMessages] = useState<RailtracksMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageIdRef = useRef(0);

  const nextId = useCallback(() => {
    messageIdRef.current++;
    return `msg-${messageIdRef.current}`;
  }, []);

  // Connect SSE directly to agent
  useEffect(() => {
    const es = new EventSource(`${agentUrl}/events`);
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === 'tool_invoked') {
          const tool = parsed.data;
          let args: Record<string, unknown> = {};
          try {
            args = typeof tool.arguments === 'string'
              ? JSON.parse(tool.arguments)
              : (tool.arguments || {});
          } catch {
            args = { raw: tool.arguments };
          }

          const invocation: RailtracksToolInvocation = {
            toolCallId: tool.identifier || `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            toolName: tool.name,
            args,
            result: tool.result,
            success: tool.success,
            state: 'result',
          };

          // Show tool invocation IMMEDIATELY
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content && last.toolInvocations) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                toolInvocations: [...last.toolInvocations, invocation],
              };
              return updated;
            }
            return [...prev, {
              id: nextId(),
              role: 'assistant' as const,
              content: '',
              toolInvocations: [invocation],
            }];
          });
        }

        if (parsed.type === 'assistant_response') {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content && last.toolInvocations) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                content: parsed.data || '',
                timestamp: parsed.timestamp,
              };
              return updated;
            }
            return [...prev, {
              id: nextId(),
              role: 'assistant' as const,
              content: parsed.data || '',
              timestamp: parsed.timestamp,
            }];
          });
          setIsLoading(false);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [agentUrl, nextId]);

  const sendMessage = useCallback(async (content?: string) => {
    const text = content ?? input;
    if (!text.trim()) return;

    setMessages(prev => [
      ...prev,
      { id: nextId(), role: 'user' as const, content: text },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      // Send directly to agent — no Next.js proxy needed
      await fetch(`${agentUrl}/send_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, context }),
      });
    } catch (e) {
      console.error('Send message error:', e);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant' as const, content: '⚠️ Failed to send message. Is the agent running?' },
      ]);
    }
  }, [input, agentUrl, context, nextId]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage();
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isConnected,
    handleSubmit,
    handleInputChange,
    sendMessage,
  };
}

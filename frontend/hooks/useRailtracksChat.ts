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
  apiEndpoint: string;
}

export function useRailtracksChat({ apiEndpoint }: UseRailtracksChatOptions) {
  const [messages, setMessages] = useState<RailtracksMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingToolsRef = useRef<RailtracksToolInvocation[]>([]);
  const messageIdRef = useRef(0);

  const nextId = useCallback(() => {
    messageIdRef.current++;
    return `msg-${messageIdRef.current}`;
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const es = new EventSource(apiEndpoint);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === 'assistant_response') {
          // Collect pending tool invocations and attach to this message
          const toolInvocations = pendingToolsRef.current.length > 0
            ? [...pendingToolsRef.current]
            : undefined;
          pendingToolsRef.current = [];

          setMessages(prev => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant' as const,
              content: parsed.data || '',
              timestamp: parsed.timestamp,
              toolInvocations,
            },
          ]);
          setIsLoading(false);
        }

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

          pendingToolsRef.current.push({
            toolCallId: tool.identifier || `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            toolName: tool.name,
            args,
            result: tool.result,
            success: tool.success,
            state: 'result' as const,
          });
        }
        // heartbeat events are ignored
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [apiEndpoint, nextId]);

  const sendMessage = useCallback(async (content?: string) => {
    const text = content ?? input;
    if (!text.trim()) return;

    // Add user message to state
    setMessages(prev => [
      ...prev,
      { id: nextId(), role: 'user' as const, content: text },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
    } catch (e) {
      console.error('Send message error:', e);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant' as const, content: '⚠️ Failed to send message. Is the agent running?' },
      ]);
    }
  }, [input, apiEndpoint, nextId]);

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

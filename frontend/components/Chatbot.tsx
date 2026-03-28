'use client';

import React from 'react';
import { useChat } from 'ai/react';
import { 
  Conversation, 
  ConversationContent, 
  ConversationScrollButton,
  ConversationEmptyState
} from './ai-elements/conversation';
import { 
  Message, 
  MessageContent, 
  MessageResponse 
} from './ai-elements/message';
import { 
  PromptInput, 
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputBody
} from './ai-elements/prompt-input';
import { 
  Sparkles, 
  Maximize,
  ArrowRightIcon,
  Paperclip,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatbotProps {
  patientName: string;
}

export default function Chatbot({ patientName }: ChatbotProps) {
  // Use classic useChat from ai/react (v3.x compatible)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your MediMemo assistant. How can I help you with **${patientName}'s** records today?`
      },
      {
        id: 'm1',
        role: 'user',
        content: "What was the result of the last blood test?"
      },
      {
        id: 'm2',
        role: 'assistant',
        content: "The last blood test from **Oct 25, 2025** showed a glucose level of **95 mg/dL**, which is within the normal range. Your cholesterol levels have also improved slightly compared to the previous test."
      }
    ]
  });

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
               <span className={`flex h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></span>
               <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                 {isLoading ? 'Thinking...' : 'Ready to help'}
               </span>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Maximize size={16} />
        </button>
      </div>

      {/* Conversation Area */}
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState 
              title="No messages yet"
              description={`Ask me anything about ${patientName}'s medical history.`}
              icon={<Sparkles className="size-8 text-blue-500" />}
            />
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    <MessageResponse>{m.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 border-t border-slate-50 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <PromptInputProvider>
          <PromptInput 
            onSubmit={() => {
              handleSubmit();
            }}
            className="[&_[data-slot=input-group]]:border-none [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:h-auto [&_[data-slot=input-group]]:p-0"
          >
            <PromptInputBody>
              <div className="flex items-end gap-2 bg-slate-50/80 border border-slate-200/60 rounded-[28px] p-2 pr-3 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50 focus-within:bg-white transition-all w-full shadow-sm">
                <button type="button" className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors hover:bg-white rounded-full self-end shrink-0">
                  <Paperclip size={18} />
                </button>
                <PromptInputTextarea 
                  placeholder={`Ask about ${patientName}...`}
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-1 max-h-32 resize-none custom-scrollbar text-slate-700 placeholder:text-slate-400 min-h-[44px]"
                />
                <div className="flex items-center gap-1 self-end mb-1 shrink-0">
                  <button type="button" className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors hover:bg-white rounded-full">
                    <Mic size={18} />
                  </button>
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center p-0"
                    disabled={isLoading || !input.trim()}
                  >
                    <ArrowRightIcon size={18} />
                  </Button>
                </div>
              </div>
            </PromptInputBody>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
}

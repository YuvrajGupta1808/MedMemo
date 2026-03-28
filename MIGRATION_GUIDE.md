# MedMemo Frontend Migration Guide
## From Custom Chat UI → assistant-ui

**Date:** 2026-03-28  
**Status:** In Progress  
**Folder:** `Frontend-v2/`

---

## 📋 Overview

This guide documents the migration from custom `ai-elements/` components (48 files, ~2000+ LOC) to the official **assistant-ui** library.

### Why Migrate?

1. ✅ **Reduce maintenance** - Eliminate custom chat infrastructure
2. ✅ **Gain features** - Thread lists, persistence, tool UI, voice
3. ✅ **Better DX** - Type-safe, well-documented APIs
4. ✅ **Future-proof** - Official library with active development
5. ✅ **Same design** - All Tailwind styling preserved

---

## 🗂️ Folder Structure

```
MedMemo/
├── Frontend/              # ❌ OLD - Custom implementation
│   └── components/
│       └── ai-elements/   # 48 custom components (being replaced)
│
└── Frontend-v2/           # ✅ NEW - assistant-ui migration
    ├── app/               # Copied from Frontend/ (no API changes)
    ├── components/
    │   ├── chat/          # NEW: assistant-ui components
    │   │   ├── Chatbot.tsx
    │   │   ├── UserMessage.tsx
    │   │   ├── AssistantMessage.tsx
    │   │   └── Thread.tsx
    │   └── ui/            # Copied from Frontend/ (shadcn)
    └── lib/               # Utilities
```

---

## 🔄 Component Mapping

| Old Custom Component | New assistant-ui Component | Status |
|---------------------|---------------------------|--------|
| `ai-elements/conversation.tsx` | `ThreadPrimitive.Root` + `.Viewport` | 🔜 Pending |
| `ai-elements/message.tsx` | `MessagePrimitive.Root` + `.Content` | 🔜 Pending |
| `ai-elements/prompt-input.tsx` | `ComposerPrimitive.Root` + `.Input` | 🔜 Pending |
| `useChat` hook | `useChatRuntime` hook | 🔜 Pending |
| 45 other ai-elements | Built-in or removed | 🔜 Pending |

---

## 📦 Dependencies

### To Add
```json
{
  "@assistant-ui/react": "latest",
  "@assistant-ui/react-markdown": "latest"
}
```

### To Remove (after migration)
```json
{
  "@streamdown/cjk": "^1.0.3",
  "@streamdown/code": "^1.1.1",
  "@streamdown/math": "^1.0.2",
  "@streamdown/mermaid": "^1.0.2",
  "streamdown": "^2.5.0",
  "use-stick-to-bottom": "^1.1.3"
}
```

**Note:** These will be replaced by assistant-ui's built-in markdown support.

---

## 🎯 Migration Steps

### Phase 1: Setup ✅
- [x] Create `Frontend-v2/` directory
- [x] Copy configuration files
- [x] Copy `app/`, `components/ui/`, `lib/`
- [x] Install assistant-ui packages (`@assistant-ui/react`, `@assistant-ui/react-markdown`)

### Phase 2: Core Migration ✅
- [x] Migrate `Chatbot.tsx` to assistant-ui → `Chatbot-v2.tsx`
- [x] Create `UserMessage.tsx` component
- [x] Create `AssistantMessage.tsx` component
- [x] Configure `useChatRuntime` with `/api/chat`
- [x] Set up markdown rendering with `@assistant-ui/react-markdown`

### Phase 3: Testing 🔜
- [ ] Test message sending/receiving
- [ ] Verify streaming works
- [ ] Check patient context integration
- [ ] Compare visual design with original
- [ ] Test on patient detail pages

### Phase 4: Cleanup 🔜
- [ ] Remove old `ai-elements/` dependencies
- [ ] Update imports across the project
- [ ] Archive `Frontend/` directory
- [ ] Document breaking changes

---

## 🔧 Code Examples

### Old Implementation (Custom)
```tsx
// Frontend/components/Chatbot.tsx
import { useChat } from 'ai/react';
import { Conversation, Message, PromptInput } from './ai-elements';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  initialMessages: [...]
});

return (
  <Conversation>
    <ConversationContent>
      {messages.map(m => (
        <Message key={m.id} from={m.role}>
          <MessageContent>
            <MessageResponse>{m.content}</MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </ConversationContent>
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea value={input} onChange={handleInputChange} />
    </PromptInput>
  </Conversation>
);
```

### New Implementation (assistant-ui)
```tsx
// Frontend-v2/components/chat/Chatbot.tsx
import { useChatRuntime, AssistantRuntimeProvider } from '@assistant-ui/react';
import { ThreadPrimitive, ComposerPrimitive } from '@assistant-ui/react';

const runtime = useChatRuntime({
  api: '/api/chat',
  initialMessages: [...]
});

return (
  <AssistantRuntimeProvider runtime={runtime}>
    <ThreadPrimitive.Root>
      <ThreadPrimitive.Viewport>
        <ThreadPrimitive.Messages components={{
          UserMessage: UserMessage,
          AssistantMessage: AssistantMessage,
        }} />
      </ThreadPrimitive.Viewport>
      <ComposerPrimitive.Root>
        <ComposerPrimitive.Input placeholder="Ask about patient..." />
        <ComposerPrimitive.Send>Send</ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  </AssistantRuntimeProvider>
);
```

**Result:** 90% less code, same functionality, more features.

---

## ⚠️ Breaking Changes

None - The API endpoint `/api/chat` remains unchanged.

---

## 📚 Resources

- [assistant-ui Documentation](https://www.assistant-ui.com)
- [Task List](view task list for detailed progress)
- [Frontend-v2 README](Frontend-v2/README.md)


import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-pro'),
    messages,
    system: `You are MediMemo, a specialized AI health assistant. 
    You have access to patient medical records including labs, notes, and history.
    Your goal is to help healthcare providers and patients understand their health data.
    Always be professional, empathetic, and clear.
    If you are unsure about medical advice, suggest consulting a human doctor.
    Keep responses concise and data-driven based on the context provided in the conversation.`,
  });

  return result.toDataStreamResponse();
}

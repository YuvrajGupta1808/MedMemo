export const runtime = 'nodejs';

const AGENT_URL = process.env.AGENT_URL ?? 'http://127.0.0.1:7000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${AGENT_URL}/send_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e.message || 'Failed to reach agent' }, { status: 502 });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/events`, {
      headers: { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });

    if (!res.ok || !res.body) {
      return new Response('Agent not available', { status: 502 });
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: any) {
    return new Response(`Agent connection failed: ${e.message}`, { status: 502 });
  }
}

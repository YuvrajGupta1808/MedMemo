export const runtime = 'nodejs';

const AGENT_URL = process.env.AGENT_URL ?? 'http://127.0.0.1:7001';

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



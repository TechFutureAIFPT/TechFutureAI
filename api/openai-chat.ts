/**
 * Vercel Serverless: proxy OpenAI chat completions (tránh CORS trên trình duyệt).
 * Env: VITE_OPENAI_API_KEY hoặc OPENAI_API_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: { message: 'Method Not Allowed' } });
    return;
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'OpenAI API key not configured on server' } });
    return;
  }

  const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: bodyStr,
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Proxy error';
    res.status(500).json({ error: { message: msg } });
  }
}

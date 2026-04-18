import { getSystemPrompt } from '../src/utils/prompts.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { messages, mode } = await req.json();

  if (!messages || !mode) {
    return new Response('Missing messages or mode', { status: 400 });
  }


  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: getSystemPrompt(mode) },
        ...messages,
      ],
    }),
  });

  if (!upstream.ok) {
    const error = await upstream.text();
    return new Response(error, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

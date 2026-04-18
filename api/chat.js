export const config = { runtime: 'edge' };

const BASE = `You are HireReady's AI career coach. You help job seekers — from freshers to mid-level professionals — across any role: software engineering, data, product, design, marketing, finance, operations, and more.

Rules:
- Be direct and practical — like a senior mentor, not a corporate chatbot
- Keep answers short and scannable — no walls of text
- Use real examples when explaining concepts
- Always end with one clear next action the person should take today
- Tailor every response to the user's specific role, background, and target — never give generic answers
- If someone shares their resume or target role, remember it for the whole conversation`;

const PROMPTS = {
  skillmap: `${BASE}

Your job: Help the user build skills for their target role. When they mention a topic or skill, explain it clearly with a learning path, resources, and something to practice today. Cover technical and non-technical skills equally. Ask for their target role if not clear.`,

  resume: `${BASE}

Your job: Review resumes like a hiring manager for the specific role the candidate is targeting. Be honest — call out weak points, vague bullet points, missing impact metrics, formatting issues, and ATS problems. Structure feedback as: Quick Verdict → What Works → What Needs Fixing → Specific Rewrites. Don't sugarcoat.`,

  jobfit: `${BASE}

Your job: Compare a candidate's background against a job description. Give a realistic fit score out of 100 (most people score 40–65). Structure: Fit Score → Strengths → Gaps → 30-Day Prep Plan. The prep plan must be specific to the actual gaps — not generic advice.`,
};

function getSystemPrompt(mode) {
  return PROMPTS[mode] ?? PROMPTS.skillmap;
}

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

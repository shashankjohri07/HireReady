import { useState, useCallback, useEffect } from 'react';

/**
 * Architecture:
 *  - Messages persisted to sessionStorage per mode (survives page refresh within tab)
 *  - resumeContext is injected as the first user message so Groq always has full context
 *  - Streaming parsed via OpenAI-compatible SSE (choices[0].delta.content)
 *  - Stateless API server — no server-side session; context lives entirely in the message array
 */
export function useChat(mode) {
  const storageKey = `hr_chat_${mode}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(messages)); }
    catch { /* quota exceeded — ignore */ }
  }, [messages, storageKey]);

  const sendMessage = useCallback(async (content) => {
    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    setStreaming('');
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, mode }),
      });

      if (!res.ok) {
        const body = await res.text();
        let msg = `API error ${res.status}`;
        try { msg = JSON.parse(body)?.error?.message ?? msg; } catch {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) { accumulated += text; setStreaming(accumulated); }
          } catch { /* malformed chunk */ }
        }
      }

      setMessages([...history, { role: 'assistant', content: accumulated }]);
      setStreaming('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [messages, mode]);

  const reset = useCallback(() => {
    setMessages([]);
    setStreaming('');
    setError(null);
    try { sessionStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return { messages, streaming, loading, error, sendMessage, reset };
}

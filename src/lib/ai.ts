import Anthropic from '@anthropic-ai/sdk'

// ============================ MULTI-PROVIDER AI CLIENT ============================
// Supported Providers:
// 1. 'gemini' (Default & Recommended for Iran): Google Gemini 2.0 Flash / 1.5 Flash
//    Env: GEMINI_API_KEY or AI_API_KEY, AI_MODEL (default: gemini-2.0-flash)
// 2. 'openai-compatible': OpenRouter, DeepSeek, Avanan, OneAPI, etc.
//    Env: AI_BASE_URL, OPENAI_API_KEY or AI_API_KEY, AI_MODEL (default: deepseek-chat)
// 3. 'anthropic': Claude official or reseller
//    Env: ANTHROPIC_API_KEY or AI_API_KEY, AI_BASE_URL, AI_MODEL (default: claude-3-5-sonnet-20241022)

const PROVIDER = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai-compatible' : 'gemini')
const BASE_URL = process.env.AI_BASE_URL || undefined
const API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY || ''
const MODEL = process.env.AI_MODEL || (PROVIDER === 'gemini' ? 'gemini-2.0-flash' : PROVIDER === 'openai-compatible' ? 'deepseek-chat' : 'claude-3-5-sonnet-20241022')

export function aiEnabled(): boolean {
  return API_KEY.length > 0
}

export function getAiProviderInfo() {
  return {
    provider: PROVIDER,
    model: MODEL,
    enabled: aiEnabled(),
  }
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function chat(opts: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 2048
  const temperature = opts.temperature ?? 0.7

  // 1. Google Gemini API
  if (PROVIDER === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
    
    // Map messages to Gemini format
    const contents = opts.messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    const payload = {
      system_instruction: {
        parts: [{ text: opts.system }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API Error ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return text
  }

  // 2. OpenAI / OpenRouter / DeepSeek Compatible
  if (PROVIDER === 'openai-compatible') {
    const targetUrl = BASE_URL ? (BASE_URL.endsWith('/chat/completions') ? BASE_URL : `${BASE_URL}/chat/completions`) : 'https://api.openai.com/v1/chat/completions'
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'system', content: opts.system }, ...opts.messages],
      }),
    })
    if (!res.ok) {
      throw new Error(`OpenAI Gateway Error ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  // 3. Anthropic Claude
  const client = new Anthropic({ apiKey: API_KEY, baseURL: BASE_URL })
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system: opts.system,
    messages: opts.messages,
  })
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

/** Extract the first JSON object/array from a model reply (handles ```json fences). */
export function parseJsonReply<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.search(/[{[]/)
  if (start === -1) return null
  try {
    return JSON.parse(candidate.slice(start)) as T
  } catch {
    for (let end = candidate.length; end > start; end--) {
      try {
        return JSON.parse(candidate.slice(start, end)) as T
      } catch {
        /* keep shrinking */
      }
    }
    return null
  }
}

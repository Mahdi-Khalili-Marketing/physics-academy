import Anthropic from '@anthropic-ai/sdk'

// ============================ AI CLIENT ============================
// Provider-swappable Claude access for Iran deployment:
//   AI_PROVIDER=anthropic         → official SDK; AI_BASE_URL points at a
//                                   reseller gateway that speaks the Anthropic
//                                   Messages API (or leave unset for direct).
//   AI_PROVIDER=openai-compatible → POST {AI_BASE_URL}/chat/completions, for
//                                   resellers that only expose OpenAI format.
// No AI_API_KEY → demo mode: every feature returns canned output so the UI
// can be demoed to stakeholders without a key.

const PROVIDER = process.env.AI_PROVIDER || 'anthropic'
const BASE_URL = process.env.AI_BASE_URL || undefined
const API_KEY = process.env.AI_API_KEY || ''
const MODEL = process.env.AI_MODEL || 'claude-opus-4-8'

export function aiEnabled(): boolean {
  return API_KEY.length > 0
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function chat(opts: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 2048

  if (PROVIDER === 'openai-compatible') {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: opts.system }, ...opts.messages],
      }),
    })
    if (!res.ok) {
      throw new Error(`AI gateway error ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  const client = new Anthropic({ apiKey: API_KEY, baseURL: BASE_URL })
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
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
    // trim trailing prose after the JSON
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

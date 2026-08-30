// ============================ OPENOBSERVE OBSERVABILITY CLIENT ============================
// Supports:
// 1. OpenObserve Cloud: https://api.openobserve.ai/api/{org}/{stream}/_json
// 2. OpenObserve Self-Hosted: http://your-server:5080/api/{org}/{stream}/_json
// 3. Fallback Console Logger (when no credentials configured)

const O2_ENDPOINT = process.env.OPENOBSERVE_ENDPOINT || ''
const O2_ORG = process.env.OPENOBSERVE_ORG || 'default'
const O2_STREAM = process.env.OPENOBSERVE_STREAM || 'physics_academy_logs'
const O2_AUTH = process.env.OPENOBSERVE_AUTH_TOKEN || ''

export type LogLevel = 'info' | 'warn' | 'error' | 'metric'

export type ObservabilityPayload = {
  level: LogLevel
  event: string
  message?: string
  userId?: string
  role?: string
  meta?: Record<string, any>
  timestamp?: string
  environment?: string
}

/**
 * Dispatches a log entry to OpenObserve asynchronously without blocking the request flow.
 */
export async function logToOpenObserve(entry: ObservabilityPayload): Promise<{ success: boolean; status?: number; error?: string }> {
  const payload = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    app: 'physics-academy-edtech',
  }

  // 1. Console Fallback Mode
  if (!O2_ENDPOINT && !O2_AUTH) {
    const icon = entry.level === 'error' ? '🔴' : entry.level === 'warn' ? '🟡' : entry.level === 'metric' ? '📊' : '🟢'
    console.log(`\n${icon} [OpenObserve Mock] [${entry.level.toUpperCase()}] [${entry.event}]`, payload.message || '', entry.meta || '')
    return { success: true }
  }

  // 2. HTTP Push to OpenObserve Ingestion API
  try {
    let targetUrl = O2_ENDPOINT.replace(/\/$/, '')
    if (!targetUrl.endsWith('/_json')) {
      if (!targetUrl.includes(O2_ORG)) {
        targetUrl = `${targetUrl}/${O2_ORG}`
      }
      targetUrl = `${targetUrl}/${O2_STREAM}/_json`
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (O2_AUTH) {
      headers['Authorization'] = O2_AUTH.startsWith('Basic ') || O2_AUTH.startsWith('Bearer ')
        ? O2_AUTH
        : `Basic ${O2_AUTH}`
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify([payload]),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn(`[OpenObserve Push Failed] HTTP ${res.status}:`, errText)
      return { success: false, status: res.status, error: errText }
    }

    return { success: true, status: res.status }
  } catch (err: any) {
    console.warn('[OpenObserve Network Error]:', err?.message || err)
    return { success: false, error: err?.message || 'Network error' }
  }
}

// ============================ CONVENIENCE HELPERS ============================

export function trackEvent(event: string, meta?: Record<string, any>, userId?: string, role?: string) {
  logToOpenObserve({ level: 'info', event, meta, userId, role })
}

export function trackError(event: string, error: any, meta?: Record<string, any>, userId?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  logToOpenObserve({
    level: 'error',
    event,
    message: errorMessage,
    meta: { ...meta, stack },
    userId,
  })
}

export function trackAiTelemetry(opts: {
  provider: string
  model: string
  promptTokens?: number
  completionTokens?: number
  durationMs: number
  userId?: string
  success: boolean
}) {
  logToOpenObserve({
    level: 'metric',
    event: 'ai_interaction',
    meta: opts,
    userId: opts.userId,
  })
}

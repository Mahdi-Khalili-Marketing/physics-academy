// Simple session & auth helpers
// Uses a signed HTTP-only cookie. No external dependency.

import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import { db } from './db'

const SESSION_COOKIE = 'phys_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'physics-academy-secret-key-change-in-prod'

export function hashPassword(p: string) {
  return createHash('sha256').digest(p).toString('hex')
}

export function verifyPassword(password: string, hash: string) {
  return hashPassword(password) === hash
}

function signToken(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHash('sha256').update(`${body}.${SESSION_SECRET}`).digest('hex')
  return `${body}.${sig}`
}

function verifyToken(token: string): Record<string, unknown> | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expectedSig = createHash('sha256').update(`${body}.${SESSION_SECRET}`).digest('hex')
  if (sig !== expectedSig) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  const token = signToken({ uid: userId, ts: Date.now() })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const uid = payload.uid as string | undefined
  if (!uid) return null
  const user = await db.user.findUnique({ where: { id: uid } })
  return user
}

export async function requireUser() {
  const u = await getCurrentUser()
  if (!u) {
    throw new Error('UNAUTHORIZED')
  }
  return u
}

export async function requireRole(role: 'STUDENT' | 'TEACHER' | 'MANAGER') {
  const u = await requireUser()
  if (u.role !== role) {
    throw new Error('FORBIDDEN')
  }
  return u
}

export function newDeviceId() {
  return randomBytes(8).toString('hex')
}

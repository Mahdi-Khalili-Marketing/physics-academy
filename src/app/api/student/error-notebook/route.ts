import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/error-notebook  — list all unresolved errors
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const entries = await db.errorEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ entries })
}

// PATCH /api/student/error-notebook  — mark one as resolved { id, resolved }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id, resolved } = await req.json()
  await db.errorEntry.updateMany({
    where: { id, userId: user.id },
    data: { resolved },
  })
  return NextResponse.json({ ok: true })
}

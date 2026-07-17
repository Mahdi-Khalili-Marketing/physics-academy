import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/teacher/questions/[id]/approve  { approved: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { id } = await params
  const { approved } = await req.json()
  await db.question.update({
    where: { id },
    data: { approvalStatus: approved ? 'APPROVED' : 'REJECTED', approvedById: user.id },
  })
  return NextResponse.json({ ok: true })
}

// DELETE /api/teacher/questions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { id } = await params
  await db.question.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

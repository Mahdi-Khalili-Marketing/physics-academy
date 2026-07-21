import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/exams/[id]/start  — create a fresh attempt
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const exam = await db.exam.findUnique({ where: { id }, include: { remedialFor: true } })
  if (!exam || !exam.isActive) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })

  // Remedial quizzes belong to one student's prescription — nobody else may start them
  if (exam.type === 'REMEDIAL' && exam.remedialFor?.userId !== user.id) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }

  // Block if there's an unfinished attempt
  const unfinished = await db.examAttempt.findFirst({
    where: { examId: id, userId: user.id, isFinished: false },
  })
  if (unfinished) {
    return NextResponse.json({ attemptId: unfinished.id, resumed: true })
  }

  const attempt = await db.examAttempt.create({
    data: { examId: id, userId: user.id },
  })
  return NextResponse.json({ attemptId: attempt.id, resumed: false })
}

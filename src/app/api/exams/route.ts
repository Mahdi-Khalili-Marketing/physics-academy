import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/exams  — list all exams for the current user's grade
// Optional ?type=TOPIC_QUIZ|CHAPTER_EXAM|KONKUR_SIM
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const chapterId = searchParams.get('chapterId')

  const exams = await db.exam.findMany({
    where: {
      isActive: true,
      grade: user.grade,
      ...(type ? { type: type as any } : {}),
      ...(chapterId ? { chapterId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      chapter: { select: { id: true, title: true } },
      _count: { select: { questions: true } },
    },
  })

  // attach current user's attempts
  const attempts = await db.examAttempt.findMany({
    where: { userId: user.id, examId: { in: exams.map((e) => e.id) } },
    orderBy: { startedAt: 'desc' },
  })
  const attemptMap = new Map<string, typeof attempts>()
  for (const a of attempts) {
    const arr = attemptMap.get(a.examId) || []
    arr.push(a)
    attemptMap.set(a.examId, arr)
  }

  return NextResponse.json({
    exams: exams.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      durationMin: e.durationMin,
      questionCount: e.questionCount,
      chapter: e.chapter,
      attempts: (attemptMap.get(e.id) || []).map((a) => ({
        id: a.id,
        score: a.score,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        blankCount: a.blankCount,
        isFinished: a.isFinished,
        finishedAt: a.finishedAt,
      })),
    })),
  })
}

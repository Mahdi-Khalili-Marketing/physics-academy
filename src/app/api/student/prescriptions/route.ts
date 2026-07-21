import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/prescriptions — the student's prescription list, active first.
// Recovered ones are kept (recent only) so the student sees closed loops too.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const STATUS_RANK = { PENDING: 0, WATCHED: 1, RECOVERED: 2 } as const
  const rows = await db.prescription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      topic: { select: { id: true, title: true, chapter: { select: { title: true } } } },
      video: { select: { id: true, title: true, durationSec: true } },
      remedialExam: {
        select: {
          id: true,
          attempts: {
            where: { userId: user.id, isFinished: true },
            orderBy: { finishedAt: 'desc' },
            take: 1,
            select: { score: true, correctCount: true },
          },
        },
      },
    },
  })

  rows.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])

  return NextResponse.json({
    prescriptions: rows.map((p) => ({
      id: p.id,
      status: p.status,
      reason: p.reason,
      topicId: p.topicId,
      topicTitle: p.topic.title,
      chapterTitle: p.topic.chapter.title,
      video: p.video
        ? { id: p.video.id, title: p.video.title, durationSec: p.video.durationSec }
        : null,
      remedialExamId: p.remedialExamId,
      lastRemedialScore: p.remedialExam?.attempts[0]?.score ?? null,
      wrongCount: p.wrongCount,
      blankCount: p.blankCount,
      totalCount: p.totalCount,
      createdAt: p.createdAt,
      watchedAt: p.watchedAt,
      recoveredAt: p.recoveredAt,
    })),
  })
}

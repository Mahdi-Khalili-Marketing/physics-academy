import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/prescriptions — the student's prescription list, active first.
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
    spotPlayerLicense: user.spotPlayerLicense,
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

// PATCH /api/student/prescriptions — mark video as watched
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { prescriptionId } = await req.json()
    if (!prescriptionId) {
      return NextResponse.json({ error: 'شناسه نسخه الزامی است' }, { status: 400 })
    }

    const p = await db.prescription.findUnique({ where: { id: prescriptionId } })
    if (!p || p.userId !== user.id) {
      return NextResponse.json({ error: 'نسخه یافت نشد' }, { status: 404 })
    }

    const updated = await db.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: p.status === 'PENDING' ? 'WATCHED' : p.status,
        watchedAt: p.watchedAt || new Date(),
      },
    })

    return NextResponse.json({ success: true, prescription: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ثبت' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/teacher/questions — list questions authored by current teacher (any approval status)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const questions = await db.question.findMany({
    where: {
      authoredById: user.id,
      ...(status && status !== 'ALL' ? { approvalStatus: status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      topic: { select: { title: true } },
      chapter: { select: { title: true } },
    },
    take: 200,
  })
  return NextResponse.json({ questions })
}

// POST /api/teacher/questions — add a new question (teacher-authored, auto-approved)
// body: { chapterId, topicId, stem, optionA, optionB, optionC, optionD, correctOption, difficulty }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { chapterId, topicId, stem, optionA, optionB, optionC, optionD, correctOption, difficulty } = body
  if (!chapterId || !topicId || !stem || !optionA || !optionB || !optionC || !optionD || !correctOption) {
    return NextResponse.json({ error: 'همه فیلدها را تکمیل کنید.' }, { status: 400 })
  }
  const q = await db.question.create({
    data: {
      chapterId,
      topicId,
      stem,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      difficulty: difficulty || 'MEDIUM',
      authoredById: user.id,
      approvedById: user.id,
      approvalStatus: 'APPROVED',
    },
  })
  return NextResponse.json({ question: q })
}

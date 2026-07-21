import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/exams/[id]  — get one exam with questions (via ExamQuestion join), options
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      chapter: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            include: {
              topic: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      },
    },
  })
  if (!exam) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  if (!exam.isActive || exam.grade !== user.grade) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  if (exam.type === 'REMEDIAL') {
    const owner = await db.prescription.findUnique({ where: { remedialExamId: exam.id } })
    if (owner?.userId !== user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }
  }
  return NextResponse.json({
    exam: {
      ...exam,
      questions: exam.questions.map((eq) => ({
        id: eq.question.id,
        stem: eq.question.stem,
        optionA: eq.question.optionA,
        optionB: eq.question.optionB,
        optionC: eq.question.optionC,
        optionD: eq.question.optionD,
        difficulty: eq.question.difficulty,
        topicId: eq.question.topicId,
        topic: eq.question.topic,
      })),
    },
  })
}

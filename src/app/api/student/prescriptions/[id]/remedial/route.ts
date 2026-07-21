import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const REMEDIAL_MAX_QUESTIONS = 5

// POST /api/student/prescriptions/[id]/remedial
// Create (or reuse) the remedial quiz for a prescription. Questions come from
// the weak topic, previously-missed ones first, so passing proves recovery.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params

  const prescription = await db.prescription.findUnique({
    where: { id },
    include: { topic: { include: { chapter: true } } },
  })
  if (!prescription || prescription.userId !== user.id) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }
  if (prescription.status === 'RECOVERED') {
    return NextResponse.json({ error: 'این ضعف قبلاً برطرف شده است.' }, { status: 400 })
  }
  if (prescription.remedialExamId) {
    return NextResponse.json({ examId: prescription.remedialExamId, reused: true })
  }

  // Previously-missed questions of this topic come first
  const missed = await db.questionAnswer.findMany({
    where: { userId: user.id, isCorrect: false, question: { topicId: prescription.topicId } },
    select: { questionId: true },
    distinct: ['questionId'],
  })
  const missedIds = missed.map((m) => m.questionId)

  const pool = await db.question.findMany({
    where: { topicId: prescription.topicId, approvalStatus: 'APPROVED' },
    select: { id: true },
  })
  const ordered = [
    ...pool.filter((q) => missedIds.includes(q.id)),
    ...pool.filter((q) => !missedIds.includes(q.id)),
  ].slice(0, REMEDIAL_MAX_QUESTIONS)

  if (ordered.length === 0) {
    return NextResponse.json(
      { error: 'برای این مبحث هنوز سؤال تأییدشده‌ای ثبت نشده است.' },
      { status: 400 },
    )
  }

  const exam = await db.exam.create({
    data: {
      title: `آزمون مجدد — ${prescription.topic.title}`,
      type: 'REMEDIAL',
      chapterId: prescription.topic.chapterId,
      grade: prescription.topic.chapter.grade,
      durationMin: Math.max(5, ordered.length * 2),
      questionCount: ordered.length,
      questions: {
        create: ordered.map((q, i) => ({ questionId: q.id, order: i })),
      },
    },
  })
  await db.prescription.update({
    where: { id: prescription.id },
    data: { remedialExamId: exam.id },
  })

  return NextResponse.json({ examId: exam.id, reused: false })
}

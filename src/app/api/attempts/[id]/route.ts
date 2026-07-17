import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/attempts/[id] — full review of an attempt: questions, options, correct, user's selection
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const attempt = await db.examAttempt.findUnique({
    where: { id },
    include: {
      exam: { include: { chapter: true } },
      answers: {
        include: {
          question: {
            include: {
              topic: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  })
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }
  return NextResponse.json({
    attempt: {
      id: attempt.id,
      score: attempt.score,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      blankCount: attempt.blankCount,
      durationSec: attempt.durationSec,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      weakTopics: attempt.weakTopics,
      prescription: attempt.prescription,
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        type: attempt.exam.type,
        chapter: attempt.exam.chapter,
      },
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        selected: a.selected,
        isCorrect: a.isCorrect,
        timeSpentSec: a.timeSpentSec,
        question: {
          stem: a.question.stem,
          optionA: a.question.optionA,
          optionB: a.question.optionB,
          optionC: a.question.optionC,
          optionD: a.question.optionD,
          correctOption: a.question.correctOption,
          difficulty: a.question.difficulty,
          topic: a.question.topic,
        },
      })),
    },
  })
}

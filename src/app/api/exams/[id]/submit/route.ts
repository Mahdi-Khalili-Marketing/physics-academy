import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/exams/[id]/submit
// body: { attemptId, answers: [{ questionId, selected: 'A'|'B'|'C'|'D'|null, timeSpentSec }] }
//
// Smart Analysis Engine:
//   1) Save answers + score
//   2) DIAGNOSIS: find weak topics (where wrong rate >= 50%)
//   3) PRESCRIPTION: connect each weak topic to the most relevant video in the library
//   4) Add wrong answers to the Error Notebook
//   5) Return diagnosis + prescription for the student dashboard
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const { attemptId, answers } = (await req.json()) as {
    attemptId: string
    answers: { questionId: string; selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSec: number }[]
  }

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      chapter: true,
      questions: { include: { question: { include: { topic: true } } } },
    },
  })
  if (!exam) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })

  // Flatten ExamQuestion[] → Question[]
  const questions = exam.questions.map((eq) => eq.question)

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  })
  if (!attempt || attempt.userId !== user.id || attempt.examId !== id) {
    return NextResponse.json({ error: 'تلاش نامعتبر' }, { status: 403 })
  }
  if (attempt.isFinished) {
    return NextResponse.json({ error: 'این آزمون قبلاً ثبت شده است.' }, { status: 400 })
  }

  // 1) Save answers
  let correctCount = 0
  let wrongCount = 0
  let blankCount = 0
  const wrongByTopic: Record<string, { topicId: string; topicTitle: string; wrong: number; total: number }> = {}
  const wrongAnswersToSave: {
    questionId: string
    stem: string
    correctOption: 'A' | 'B' | 'C' | 'D'
    selected: 'A' | 'B' | 'C' | 'D' | null
    chapterTitle: string
    topicTitle: string
  }[] = []

  for (const ans of answers) {
    const q = questions.find((qq) => qq.id === ans.questionId)
    if (!q) continue
    const isCorrect = ans.selected === q.correctOption
    if (ans.selected === null) blankCount++
    else if (isCorrect) correctCount++
    else wrongCount++

    // upsert answer (delete existing first if any)
    const existing = attempt.answers.find((a) => a.questionId === q.id)
    if (existing) {
      await db.questionAnswer.update({
        where: { id: existing.id },
        data: { selected: ans.selected, isCorrect, timeSpentSec: ans.timeSpentSec },
      })
    } else {
      await db.questionAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: q.id,
          userId: user.id,
          selected: ans.selected,
          isCorrect,
          timeSpentSec: ans.timeSpentSec,
        },
      })
    }

    // diagnosis aggregation by topic
    const topic = await db.topic.findUnique({ where: { id: q.topicId } })
    const topicKey = q.topicId
    if (!wrongByTopic[topicKey]) {
      wrongByTopic[topicKey] = { topicId: topicKey, topicTitle: topic?.title || '—', wrong: 0, total: 0 }
    }
    wrongByTopic[topicKey].total++
    if (!isCorrect && ans.selected !== null) {
      wrongByTopic[topicKey].wrong++
    }

    // wrong-answer notebook entry
    if (!isCorrect && ans.selected !== null) {
      wrongAnswersToSave.push({
        questionId: q.id,
        stem: q.stem,
        correctOption: q.correctOption,
        selected: ans.selected,
        chapterTitle: exam.chapter?.title || '',
        topicTitle: topic?.title || '',
      })
    }
  }

  // 2) DIAGNOSIS — weak topics are those with wrong rate >= 50%
  const weakTopics = Object.values(wrongByTopic)
    .filter((t) => t.total >= 2 && t.wrong / t.total >= 0.5)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total)
    .map((t) => ({ topicId: t.topicId, topicTitle: t.topicTitle, wrong: t.wrong, total: t.total }))

  // 3) PRESCRIPTION — for each weak topic, link to the most relevant published video
  const prescription: { topicId: string; topicTitle: string; videoId: string; videoTitle: string }[] = []
  for (const wt of weakTopics) {
    const v = await db.video.findFirst({
      where: { topicId: wt.topicId, isPublished: true },
    })
    if (v) {
      prescription.push({ topicId: wt.topicId, topicTitle: wt.topicTitle, videoId: v.id, videoTitle: v.title })
    }
  }

  // 4) Update error notebook (upsert per question)
  for (const w of wrongAnswersToSave) {
    await db.errorEntry.upsert({
      where: { userId_questionId: { userId: user.id, questionId: w.questionId } },
      update: {
        stem: w.stem,
        correctOption: w.correctOption,
        selected: w.selected,
        chapterTitle: w.chapterTitle,
        topicTitle: w.topicTitle,
        resolved: false,
      },
      create: {
        userId: user.id,
        questionId: w.questionId,
        stem: w.stem,
        correctOption: w.correctOption,
        selected: w.selected,
        chapterTitle: w.chapterTitle,
        topicTitle: w.topicTitle,
      },
    })
  }

  // 5) Compute final score on konkur scale (0..20, with negative marking)
  const total = questions.length
  const rawScore = total > 0 ? (correctCount - wrongCount * 0.25) * (20 / total) : 0
  const finalScore = Math.max(0, Number(rawScore.toFixed(2)))

  const durationSec = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)
  const updated = await db.examAttempt.update({
    where: { id: attempt.id },
    data: {
      isFinished: true,
      finishedAt: new Date(),
      durationSec,
      correctCount,
      wrongCount,
      blankCount,
      score: finalScore,
      weakTopics: weakTopics as any,
      prescription: prescription as any,
    },
  })

  return NextResponse.json({
    attempt: {
      id: updated.id,
      score: updated.score,
      correctCount: updated.correctCount,
      wrongCount: updated.wrongCount,
      blankCount: updated.blankCount,
      durationSec: updated.durationSec,
    },
    diagnosis: weakTopics,
    prescription,
  })
}

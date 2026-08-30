import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  diagnoseWeakTopics,
  prescribeForAttempt,
  REMEDIAL_PASS_RATIO,
  type TopicStat,
} from '@/lib/prescription'

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
  
  const rawBody = (await req.json().catch(() => ({}))) as any
  const attemptId = rawBody.attemptId

  let answersList: { questionId: string; selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSec: number }[] = []
  if (Array.isArray(rawBody.answers)) {
    answersList = rawBody.answers
  } else if (rawBody.answers && typeof rawBody.answers === 'object') {
    answersList = Object.entries(rawBody.answers).map(([qId, val]) => {
      if (typeof val === 'string') {
        return { questionId: qId, selected: val as any, timeSpentSec: 60 }
      }
      return {
        questionId: qId,
        selected: (val as any)?.selected ?? null,
        timeSpentSec: (val as any)?.timeSpentSec ?? 60,
      }
    })
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
  const statsByTopic: Record<string, TopicStat> = {}
  const wrongAnswersToSave: {
    questionId: string
    stem: string
    correctOption: 'A' | 'B' | 'C' | 'D'
    selected: 'A' | 'B' | 'C' | 'D' | null
    chapterTitle: string
    topicTitle: string
  }[] = []

  for (const ans of answersList) {
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

    // diagnosis aggregation by topic (blanks tracked separately — skipping is weakness too)
    const topic = q.topic
    const topicKey = q.topicId
    if (!statsByTopic[topicKey]) {
      statsByTopic[topicKey] = { topicId: topicKey, topicTitle: topic?.title || '—', wrong: 0, blank: 0, total: 0 }
    }
    statsByTopic[topicKey].total++
    if (ans.selected === null) statsByTopic[topicKey].blank++
    else if (!isCorrect) statsByTopic[topicKey].wrong++

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

  // 2) DIAGNOSIS — weighted weak-topic detection (wrong + partial weight for blanks)
  const diagnoses = diagnoseWeakTopics(Object.values(statsByTopic))
  const weakTopics = diagnoses.map((d) => ({
    topicId: d.topicId,
    topicTitle: d.topicTitle,
    wrong: d.wrong,
    blank: d.blank,
    total: d.total,
  }))

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

  // 6) PRESCRIPTION — persist trackable prescriptions (skip remedial quizzes:
  //    they verify recovery, they don't open new prescriptions)
  let prescriptions: Awaited<ReturnType<typeof prescribeForAttempt>> = []
  if (exam.type !== 'REMEDIAL') {
    prescriptions = await prescribeForAttempt(user.id, attempt.id, diagnoses)
  }
  const prescription = prescriptions
    .filter((p) => p.videoId)
    .map((p) => ({
      prescriptionId: p.id,
      topicId: p.topicId,
      topicTitle: p.topicTitle,
      videoId: p.videoId as string,
      videoTitle: p.videoTitle as string,
      reason: p.reason,
    }))

  // 7) REMEDIAL RECOVERY — if this exam is a remedial quiz tied to a
  //    prescription, a pass marks the weakness as recovered
  let remedial: { prescriptionId: string; passed: boolean; ratio: number } | null = null
  if (exam.type === 'REMEDIAL') {
    const p = await db.prescription.findUnique({ where: { remedialExamId: exam.id } })
    if (p && p.userId === user.id && p.status !== 'RECOVERED') {
      const ratio = total > 0 ? correctCount / total : 0
      const passed = ratio >= REMEDIAL_PASS_RATIO
      if (passed) {
        await db.prescription.update({
          where: { id: p.id },
          data: { status: 'RECOVERED', recoveredAt: new Date() },
        })
      }
      remedial = { prescriptionId: p.id, passed, ratio: Number(ratio.toFixed(2)) }
    }
  }

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
    remedial,
  })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/dashboard
// Returns a unified snapshot for the student dashboard:
//  - recent attempts with scores
//  - mastery map (chapter-by-chapter green/yellow/red)
//  - error notebook size
//  - leitner cards due today
//  - speed-vs-accuracy scatter
//  - progress over time
//  - notifications
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const attempts = await db.examAttempt.findMany({
    where: { userId: user.id, isFinished: true },
    orderBy: { finishedAt: 'desc' },
    take: 50,
    include: {
      exam: {
        include: { chapter: true },
      },
    },
  })

  // Mastery map: for each chapter, compute average score across attempts on that chapter
  const chapters = await db.chapter.findMany({
    where: { grade: user.grade },
    orderBy: { order: 'asc' },
    include: { topics: true },
  })
  const mastery = chapters.map((ch) => {
    const chAttempts = attempts.filter((a) => a.exam.chapterId === ch.id)
    const avgScore = chAttempts.length
      ? chAttempts.reduce((s, a) => s + a.score, 0) / chAttempts.length
      : null
    let level: 'green' | 'yellow' | 'red' | 'none' = 'none'
    if (avgScore !== null) {
      if (avgScore >= 16) level = 'green'
      else if (avgScore >= 10) level = 'yellow'
      else level = 'red'
    }
    return {
      chapterId: ch.id,
      title: ch.title,
      slug: ch.slug,
      order: ch.order,
      avgScore: avgScore !== null ? Number(avgScore.toFixed(2)) : null,
      level,
      attemptsCount: chAttempts.length,
    }
  })

  // Error notebook
  const errorCount = await db.errorEntry.count({ where: { userId: user.id, resolved: false } })

  // Leitner cards due today
  const now = new Date()
  const dueCards = await db.leitnerCard.count({
    where: { userId: user.id, nextReview: { lte: now } },
  })
  const totalCards = await db.leitnerCard.count({ where: { userId: user.id } })

  // Speed vs Accuracy scatter: per attempt, average time per question vs score
  const speedAccuracy = attempts.map((a) => {
    const totalQ = a.correctCount + a.wrongCount + a.blankCount
    const avgTimePerQ = totalQ > 0 ? a.durationSec / totalQ : 0
    return {
      attemptId: a.id,
      examTitle: a.exam.title,
      examType: a.exam.type,
      score: a.score,
      avgTimePerQ: Math.round(avgTimePerQ),
    }
  })

  // Progress over time (chronological)
  const progress = [...attempts]
    .reverse()
    .map((a, i) => ({
      index: i + 1,
      score: a.score,
      date: a.finishedAt,
      title: a.exam.title,
    }))

  // Wrong-option pattern (which wrong option is most chosen)
  const allAnswers = await db.questionAnswer.findMany({
    where: { userId: user.id, isCorrect: false, selected: { not: null } },
    take: 500,
  })
  const wrongOptionCounts = { A: 0, B: 0, C: 0, D: 0 }
  for (const a of allAnswers) {
    if (a.selected) wrongOptionCounts[a.selected]++
  }

  // Notifications (user-scoped + ALL)
  const notifications = await db.notification.findMany({
    where: { OR: [{ scope: 'ALL' }, { userId: user.id }] },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Recent attempts (last 6)
  const recentAttempts = attempts.slice(0, 6).map((a) => ({
    id: a.id,
    examTitle: a.exam.title,
    examType: a.exam.type,
    chapterTitle: a.exam.chapter?.title || null,
    score: a.score,
    correctCount: a.correctCount,
    wrongCount: a.wrongCount,
    blankCount: a.blankCount,
    durationSec: a.durationSec,
    finishedAt: a.finishedAt,
  }))

  // Class average comparison
  const classAvg =
    attempts.length > 0
      ? Number((attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(2))
      : 0

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatarColor: user.avatarColor,
    },
    stats: {
      totalAttempts: attempts.length,
      avgScore: classAvg,
      masteryGreen: mastery.filter((m) => m.level === 'green').length,
      masteryYellow: mastery.filter((m) => m.level === 'yellow').length,
      masteryRed: mastery.filter((m) => m.level === 'red').length,
      masteryNone: mastery.filter((m) => m.level === 'none').length,
      errorsUnresolved: errorCount,
      leitnerDue: dueCards,
      leitnerTotal: totalCards,
    },
    mastery,
    speedAccuracy,
    progress,
    wrongOptionCounts,
    recentAttempts,
    notifications,
  })
}

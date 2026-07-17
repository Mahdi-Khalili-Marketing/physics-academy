import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/mastery — chapter-by-chapter mastery with topic-level details
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const chapters = await db.chapter.findMany({
    where: { grade: user.grade },
    orderBy: { order: 'asc' },
    include: { topics: { orderBy: { order: 'asc' } } },
  })

  // all attempts with answers (for topic-level mastery)
  const attempts = await db.examAttempt.findMany({
    where: { userId: user.id, isFinished: true },
    include: {
      answers: { include: { question: { select: { topicId: true, chapterId: true } } } },
    },
  })

  // build topic stats
  const topicStats: Record<string, { correct: number; total: number }> = {}
  for (const a of attempts) {
    for (const ans of a.answers) {
      const tid = ans.question.topicId
      if (!topicStats[tid]) topicStats[tid] = { correct: 0, total: 0 }
      topicStats[tid].total++
      if (ans.isCorrect) topicStats[tid].correct++
    }
  }

  const result = chapters.map((ch) => {
    const topics = ch.topics.map((t) => {
      const st = topicStats[t.id] || { correct: 0, total: 0 }
      const ratio = st.total > 0 ? st.correct / st.total : null
      let level: 'green' | 'yellow' | 'red' | 'none' = 'none'
      if (ratio !== null) {
        if (ratio >= 0.75) level = 'green'
        else if (ratio >= 0.5) level = 'yellow'
        else level = 'red'
      }
      return {
        topicId: t.id,
        title: t.title,
        slug: t.slug,
        correct: st.correct,
        total: st.total,
        ratio: ratio !== null ? Number(ratio.toFixed(2)) : null,
        level,
      }
    })
    const totalQ = topics.reduce((s, t) => s + t.total, 0)
    const totalC = topics.reduce((s, t) => s + t.correct, 0)
    const ratio = totalQ > 0 ? totalC / totalQ : null
    let level: 'green' | 'yellow' | 'red' | 'none' = 'none'
    if (ratio !== null) {
      if (ratio >= 0.75) level = 'green'
      else if (ratio >= 0.5) level = 'yellow'
      else level = 'red'
    }
    return {
      chapterId: ch.id,
      title: ch.title,
      slug: ch.slug,
      order: ch.order,
      ratio: ratio !== null ? Number(ratio.toFixed(2)) : null,
      level,
      topics,
    }
  })

  return NextResponse.json({ chapters: result })
}

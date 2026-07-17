import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/teacher/dashboard
// - classes taught by this teacher
// - class weakness heatmap (per topic, aggregated across class students)
// - Persian analytical summary (rule-based) of class state before each class
// - pending question approvals count
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const classes = await db.class.findMany({
    where: { teacherId: user.id },
    include: { teacher: { select: { id: true, name: true } } },
  })

  const studentIds: string[] = []
  for (const c of classes) {
    const ids = (c.studentIds as unknown as string[]) || []
    studentIds.push(...ids)
  }
  const uniqueStudentIds = Array.from(new Set(studentIds))

  // All attempts by these students
  const attempts = await db.examAttempt.findMany({
    where: { userId: { in: uniqueStudentIds }, isFinished: true },
    include: {
      answers: { include: { question: { select: { topicId: true, topic: { select: { title: true } }, chapterId: true, chapter: { select: { title: true } } } } } },
      exam: { select: { title: true, type: true, chapterId: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { finishedAt: 'desc' },
    take: 1000,
  })

  // Heatmap: topicId → { topicTitle, chapterTitle, correct, total, distinctStudents }
  const heatmap: Record<string, { topicTitle: string; chapterTitle: string; correct: number; total: number; students: Set<string> }> = {}
  for (const a of attempts) {
    for (const ans of a.answers) {
      const tid = ans.question.topicId
      if (!heatmap[tid]) {
        heatmap[tid] = {
          topicTitle: ans.question.topic?.title || '—',
          chapterTitle: ans.question.chapter?.title || '—',
          correct: 0,
          total: 0,
          students: new Set(),
        }
      }
      heatmap[tid].total++
      if (ans.isCorrect) heatmap[tid].correct++
      heatmap[tid].students.add(a.userId)
    }
  }
  const heatArr = Object.entries(heatmap)
    .map(([tid, v]) => ({
      topicId: tid,
      topicTitle: v.topicTitle,
      chapterTitle: v.chapterTitle,
      correct: v.correct,
      total: v.total,
      ratio: v.total > 0 ? Number((v.correct / v.total).toFixed(2)) : 0,
      students: v.students.size,
    }))
    .sort((a, b) => a.ratio - b.ratio)

  // Persian analytical summary
  const weakestTopics = heatArr.filter((t) => t.total >= 3 && t.ratio < 0.5).slice(0, 5)
  const strongTopics = heatArr.filter((t) => t.total >= 3 && t.ratio >= 0.75).slice(0, 3)
  const avgScore =
    attempts.length > 0 ? Number((attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(2)) : 0
  const inactiveStudents = uniqueStudentIds.length - new Set(attempts.map((a) => a.userId)).size

  let summary = `📊 خلاصه وضعیت کلاس:\n\n`
  summary += `تعداد دانش‌آموزان فعال: ${uniqueStudentIds.length - inactiveStudents} از ${uniqueStudentIds.length} نفر.\n`
  summary += `میانگین نمره کلاس: ${avgScore.toFixed(2)} از ۲۰.\n\n`
  if (weakestTopics.length > 0) {
    summary += `🔴 مباحثی که کلاس در آن‌ها ضعف دارد:\n`
    for (const t of weakestTopics) {
      const pct = Math.round((1 - t.ratio) * 100)
      summary += `• ${t.topicTitle} (فصل ${t.chapterTitle}) — ${pct}٪ خطا در ${t.total} پاسخ.\n`
    }
    summary += `\nپیشنهاد: در جلسه آینده، این مباحث را با مثال‌های بیشتر و تمرین اضافی مرور کنید.\n`
  }
  if (strongTopics.length > 0) {
    summary += `\n🟢 مباحث تسلط‌یافته:\n`
    for (const t of strongTopics) {
      summary += `• ${t.topicTitle} — ${Math.round(t.ratio * 100)}٪ صحت.\n`
    }
  }
  if (inactiveStudents > 0) {
    summary += `\n⚠️ ${inactiveStudents} دانش‌آموز در دو هفته اخیر فعالیتی نداشته‌اند؛ پیگیری کنید.\n`
  }

  // Pending question approvals
  const pendingCount = await db.question.count({
    where: { approvalStatus: 'PENDING', authoredById: user.id },
  })

  // Recent submissions (last 7 days) per student
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentActivity = attempts
    .filter((a) => a.finishedAt && a.finishedAt >= sevenDaysAgo)
    .slice(0, 30)
    .map((a) => ({
      studentId: a.user.id,
      studentName: a.user.name,
      examTitle: a.exam.title,
      examType: a.exam.type,
      score: a.score,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      durationSec: a.durationSec,
      finishedAt: a.finishedAt,
    }))

  // Per-student aggregated performance
  const perStudent: Record<string, { name: string; attempts: number; avgScore: number; lastActive: Date | null }> = {}
  for (const a of attempts) {
    if (!perStudent[a.userId]) {
      perStudent[a.userId] = { name: a.user.name, attempts: 0, avgScore: 0, lastActive: null }
    }
    perStudent[a.userId].attempts++
    perStudent[a.userId].avgScore += a.score
    if (!perStudent[a.userId].lastActive || a.finishedAt! > perStudent[a.userId].lastActive!) {
      perStudent[a.userId].lastActive = a.finishedAt
    }
  }
  const studentPerf = Object.entries(perStudent).map(([id, v]) => ({
    studentId: id,
    name: v.name,
    attempts: v.attempts,
    avgScore: v.attempts > 0 ? Number((v.avgScore / v.attempts).toFixed(2)) : 0,
    lastActive: v.lastActive,
    isActive: v.lastActive ? v.lastActive >= sevenDaysAgo : false,
  }))

  return NextResponse.json({
    teacher: { id: user.id, name: user.name },
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      studentCount: ((c.studentIds as unknown as string[]) || []).length,
    })),
    heatmap: heatArr,
    summary,
    weakestTopics,
    strongTopics,
    avgScore,
    pendingApprovals: pendingCount,
    recentActivity,
    studentPerformance: studentPerf,
    inactiveStudents,
    totalStudents: uniqueStudentIds.length,
  })
}

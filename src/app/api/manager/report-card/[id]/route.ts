import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/manager/report-card/[id] — printable report card for one student
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MANAGER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { id } = await params

  const student = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, grade: true, parentPhone: true, createdAt: true },
  })
  if (!student) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })

  const attempts = await db.examAttempt.findMany({
    where: { userId: id, isFinished: true },
    orderBy: { finishedAt: 'asc' },
    include: { exam: { include: { chapter: true } } },
  })

  // Mastery by chapter
  const chapters = await db.chapter.findMany({
    where: { grade: student.grade },
    orderBy: { order: 'asc' },
  })
  const mastery = chapters.map((ch) => {
    const chAttempts = attempts.filter((a) => a.exam.chapterId === ch.id)
    const avg = chAttempts.length
      ? Number((chAttempts.reduce((s, a) => s + a.score, 0) / chAttempts.length).toFixed(2))
      : null
    let level: 'green' | 'yellow' | 'red' | 'none' = 'none'
    if (avg !== null) {
      if (avg >= 16) level = 'green'
      else if (avg >= 10) level = 'yellow'
      else level = 'red'
    }
    return { title: ch.title, avg, level, attempts: chAttempts.length }
  })

  const avgOverall = attempts.length
    ? Number((attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(2))
    : 0

  const errors = await db.errorEntry.count({ where: { userId: id, resolved: false } })

  // Persian summary text
  const weakChapters = mastery.filter((m) => m.level === 'red')
  const strongChapters = mastery.filter((m) => m.level === 'green')
  let summary = `دانش‌آموز ${student.name} تاکنون در ${attempts.length} آزمون شرکت کرده و میانگین نمره ${avgOverall.toFixed(2)} از ۲۰ را کسب کرده است.\n\n`
  if (weakChapters.length > 0) {
    summary += `مباحثی که نیاز به تمرکز بیشتری دارند:\n`
    for (const c of weakChapters) summary += `• ${c.title} — میانگین ${c.avg?.toFixed(2)}\n`
    summary += '\n'
  }
  if (strongChapters.length > 0) {
    summary += `مباحث با تسلط خوب:\n`
    for (const c of strongChapters) summary += `• ${c.title} — میانگین ${c.avg?.toFixed(2)}\n`
  }
  if (errors > 0) {
    summary += `\nتعداد اشتباهات ثبت‌نشده در دفتر اشتباهات: ${errors} — توصیه می‌شود پیش از آزمون بعدی مرور شوند.\n`
  }

  return NextResponse.json({
    student,
    attempts: attempts.map((a) => ({
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
    })),
    mastery,
    avgOverall,
    errors,
    summary,
    generatedAt: new Date(),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/public/report/[id] — public report for parents via SMS link
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
  }

  // Find student by id or phone
  const student = await db.user.findFirst({
    where: {
      OR: [
        { id },
        { phone: id },
      ],
      role: 'STUDENT',
    },
    select: {
      id: true,
      name: true,
      phone: true,
      grade: true,
      parentPhone: true,
      avatarColor: true,
      createdAt: true,
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'کارنامه یافت نشد یا منقضی شده است' }, { status: 404 })
  }

  // Get finished attempts
  const attempts = await db.examAttempt.findMany({
    where: { userId: student.id, isFinished: true },
    orderBy: { finishedAt: 'desc' },
    include: {
      exam: {
        include: {
          chapter: true,
        },
      },
    },
  })

  // Get chapters
  const chapters = await db.chapter.findMany({
    where: { grade: student.grade },
    orderBy: { order: 'asc' },
    include: {
      topics: true,
    },
  })

  // Mastery per chapter
  const chapterMastery = chapters.map((ch) => {
    const chAttempts = attempts.filter((a) => a.exam.chapterId === ch.id)
    const avg = chAttempts.length
      ? Number((chAttempts.reduce((sum, a) => sum + a.score, 0) / chAttempts.length).toFixed(2))
      : null

    let level: 'green' | 'yellow' | 'red' | 'none' = 'none'
    if (avg !== null) {
      if (avg >= 15) level = 'green'
      else if (avg >= 10) level = 'yellow'
      else level = 'red'
    }

    return {
      id: ch.id,
      title: ch.title,
      slug: ch.slug,
      order: ch.order,
      avgScore: avg,
      level,
      attemptsCount: chAttempts.length,
      topicsCount: ch.topics.length,
    }
  })

  // Prescriptions (weakness diagnosis & recovery)
  const prescriptions = await db.prescription.findMany({
    where: { userId: student.id },
    orderBy: { createdAt: 'desc' },
    include: {
      topic: {
        include: {
          chapter: true,
        },
      },
      video: true,
    },
  })

  const activePrescriptions = prescriptions.filter((p) => p.status !== 'RECOVERED')
  const recoveredPrescriptions = prescriptions.filter((p) => p.status === 'RECOVERED')

  // Total stats
  const totalAttempts = attempts.length
  const avgScore = totalAttempts
    ? Number((attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(2))
    : 0

  // Video watch stats
  const videoViews = await db.videoView.findMany({
    where: { userId: student.id },
    include: { video: true },
  })
  const totalWatchSec = videoViews.reduce((sum, v) => sum + (v.watchSec || 0), 0)
  const completedVideos = videoViews.filter((v) => v.completed).length

  // Errors count
  const unresolvedErrors = await db.errorEntry.count({
    where: { userId: student.id, resolved: false },
  })

  // Leitner cards
  const leitnerTotal = await db.leitnerCard.count({
    where: { userId: student.id },
  })

  // Generate actionable Persian advice for parents
  const weakChapters = chapterMastery.filter((c) => c.level === 'red')
  const strongChapters = chapterMastery.filter((c) => c.level === 'green')

  let parentAdvice = ''
  if (activePrescriptions.length > 0) {
    const topWeakTopic = activePrescriptions[0].topic.title
    parentAdvice = `در حال حاضر اولویت اصلی دانش‌آموز رفع نقطه ضعف در مبحث «${topWeakTopic}» است. تماشای ویدیوی آموزشی جبرانی و شرکت در آزمونک مجدد این مبحث توصیه می‌شود.`
  } else if (unresolvedErrors > 5) {
    parentAdvice = `تعداد ${unresolvedErrors} تست بدون مرور در دفترچه اشتباهات ثبت شده است. لطفاً فرزندتان را به مرور نیم‌ساعته دفترچه اشتباهات تشویق نمایید.`
  } else if (avgScore >= 16) {
    parentAdvice = `عملکرد دانش‌آموز بسیار عالی و در مسیر قبولی کنکور است. حفظ این استمرار و مرور هفتگی در جعبه لایتنر کلید موفقیت نهایی است.`
  } else {
    parentAdvice = `روند پیشرفت مطلوب است. شرکت منظم در آزمونک‌های بعد از هر جلسه کلاس حضوری به تثبیت تراز کمک می‌کند.`
  }

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      phone: student.phone,
      grade: student.grade === 'GRADE_12_PHYSICS' ? 'دوازدهم تجربی / ریاضی' : 'یازدهم',
      avatarColor: student.avatarColor,
      joinDate: student.createdAt,
    },
    summary: {
      totalAttempts,
      avgScore,
      totalWatchSec,
      completedVideos,
      activeWeaknesses: activePrescriptions.length,
      recoveredWeaknesses: recoveredPrescriptions.length,
      unresolvedErrors,
      leitnerTotal,
      greenChaptersCount: strongChapters.length,
      yellowChaptersCount: chapterMastery.filter((c) => c.level === 'yellow').length,
      redChaptersCount: weakChapters.length,
    },
    chapterMastery,
    prescriptions: prescriptions.slice(0, 8).map((p) => ({
      id: p.id,
      topicTitle: p.topic.title,
      chapterTitle: p.topic.chapter.title,
      videoTitle: p.video?.title || null,
      reason: p.reason,
      status: p.status,
      createdAt: p.createdAt,
      recoveredAt: p.recoveredAt,
    })),
    recentAttempts: attempts.slice(0, 5).map((a) => ({
      id: a.id,
      examTitle: a.exam.title,
      examType: a.exam.type,
      chapterTitle: a.exam.chapter?.title || null,
      score: a.score,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      blankCount: a.blankCount,
      finishedAt: a.finishedAt,
    })),
    parentAdvice,
    generatedAt: new Date().toISOString(),
  })
}

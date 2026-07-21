import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/manager/dashboard
// - KPIs: active students, MRR-equivalent (sum of paid subscriptions), early warnings
// - Revenue totals
// - Per-class performance summary
// - Active vs inactive breakdown
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MANAGER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const totalStudents = await db.user.count({ where: { role: 'STUDENT' } })
  const activeStudents = await db.user.count({ where: { role: 'STUDENT', isActive: true } })

  // active = had an attempt in last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const recentActiveIds = await db.examAttempt.findMany({
    where: { finishedAt: { gte: fourteenDaysAgo } },
    distinct: ['userId'],
    select: { userId: true },
  })
  const engagedCount = recentActiveIds.length

  // Subscriptions
  const subs = await db.subscription.findMany({ where: { isPaid: true } })
  const revenue = subs.reduce((s, x) => s + x.amount, 0)

  // Early warning: students with no attempts OR avg score < 8 in last 14 days
  const allStudents = await db.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, phone: true, createdAt: true },
  })
  const recentAttempts = await db.examAttempt.findMany({
    where: { finishedAt: { gte: fourteenDaysAgo } },
    include: { user: { select: { id: true, name: true, phone: true } } },
  })
  const perStudent: Record<string, { name: string; phone: string; attempts: number; avg: number; lastActive: Date | null }> = {}
  for (const s of allStudents) {
    perStudent[s.id] = { name: s.name, phone: s.phone, attempts: 0, avg: 0, lastActive: null }
  }
  for (const a of recentAttempts) {
    const p = perStudent[a.userId]
    if (!p) continue
    p.attempts++
    p.avg += a.score
    if (!p.lastActive || a.finishedAt! > p.lastActive!) p.lastActive = a.finishedAt
  }
  const earlyWarnings = Object.entries(perStudent)
    .filter(([_, v]) => v.attempts === 0 || (v.attempts > 0 && v.avg / v.attempts < 8))
    .map(([id, v]) => ({
      studentId: id,
      name: v.name,
      phone: v.phone,
      attempts: v.attempts,
      avgScore: v.attempts > 0 ? Number((v.avg / v.attempts).toFixed(2)) : null,
      lastActive: v.lastActive,
      reason: v.attempts === 0 ? 'بدون فعالیت در ۱۴ روز اخیر' : 'میانگین نمره کمتر از ۸',
    }))

  // Classes summary
  const classes = await db.class.findMany({ include: { teacher: { select: { name: true } } } })
  const classSummaries: unknown[] = []
  for (const c of classes) {
    const ids = (c.studentIds as unknown as string[]) || []
    const classAttempts = recentAttempts.filter((a) => ids.includes(a.userId))
    const avg = classAttempts.length
      ? Number((classAttempts.reduce((s, a) => s + a.score, 0) / classAttempts.length).toFixed(2))
      : 0
    classSummaries.push({
      id: c.id,
      name: c.name,
      teacherName: c.teacher.name,
      studentCount: ids.length,
      avgScore: avg,
      recentAttempts: classAttempts.length,
    })
  }

  // Per-grade progress reports
  const reports = await db.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      grade: true,
      _count: { select: { examAttempts: true } },
    },
  })

  return NextResponse.json({
    stats: {
      totalStudents,
      activeStudents,
      engagedStudents: engagedCount,
      engagementRate: totalStudents > 0 ? Number(((engagedCount / totalStudents) * 100).toFixed(1)) : 0,
      revenue,
      paidSubscriptions: subs.length,
      earlyWarningsCount: earlyWarnings.length,
    },
    earlyWarnings,
    classSummaries,
    students: reports,
  })
}

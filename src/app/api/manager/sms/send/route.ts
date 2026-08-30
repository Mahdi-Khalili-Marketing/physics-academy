import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendParentReportNotification } from '@/lib/sms'

// POST /api/manager/sms/send
// Body: { studentId: string } or { bulk: true }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const { studentId, bulk } = body as { studentId?: string; bulk?: boolean }

  if (!studentId && !bulk) {
    return NextResponse.json({ error: 'شناسه دانش‌آموز یا دستور ارسال گروهی الزامی است.' }, { status: 400 })
  }

  // 1. Single Student SMS Dispatch
  if (studentId) {
    const student = await db.user.findUnique({
      where: { id: studentId },
      include: {
        examAttempts: { orderBy: { finishedAt: 'desc' }, take: 1, include: { exam: true } },
        prescriptions: { where: { status: { not: 'RECOVERED' } } },
      },
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'دانش‌آموز یافت نشد.' }, { status: 404 })
    }

    const recipient = student.parentPhone || student.phone
    const latestAttempt = student.examAttempts[0]
    const score = latestAttempt ? Math.round(latestAttempt.score * 10) / 10 : 0
    const examTitle = latestAttempt?.exam.title || 'آزمونک جامع فیزیک'
    const unresolved = student.prescriptions.length

    const res = await sendParentReportNotification({
      parentPhone: recipient,
      studentName: student.name,
      examTitle,
      score,
      unresolvedWeaknesses: unresolved,
      reportToken: student.id,
    })

    return NextResponse.json({
      success: res.success,
      recipient,
      provider: res.provider,
      mock: res.mock,
      error: res.error,
    })
  }

  // 2. Bulk Dispatch to all active students
  const students = await db.user.findMany({
    where: { role: 'STUDENT', isActive: true },
    include: {
      examAttempts: { orderBy: { finishedAt: 'desc' }, take: 1, include: { exam: true } },
      prescriptions: { where: { status: { not: 'RECOVERED' } } },
    },
  })

  const results: Array<{ studentId: string; name: string; success: boolean; provider?: string }> = []
  for (const s of students) {
    const recipient = s.parentPhone || s.phone
    const latestAttempt = s.examAttempts[0]
    const score = latestAttempt ? Math.round(latestAttempt.score * 10) / 10 : 0
    const examTitle = latestAttempt?.exam.title || 'آزمونک جامع فیزیک'
    const unresolved = s.prescriptions.length

    const sendRes = await sendParentReportNotification({
      parentPhone: recipient,
      studentName: s.name,
      examTitle,
      score,
      unresolvedWeaknesses: unresolved,
      reportToken: s.id,
    })
    results.push({ studentId: s.id, name: s.name, success: sendRes.success, provider: sendRes.provider })
  }

  return NextResponse.json({
    total: students.length,
    sent: results.filter((r) => r.success).length,
    results,
  })
}

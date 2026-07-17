import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/manager/students — list all students with subscriptions
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MANAGER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { examAttempts: true, videoViews: true } },
    },
  })
  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      parentPhone: s.parentPhone,
      isActive: s.isActive,
      avatarColor: s.avatarColor,
      referralCode: s.referralCode,
      createdAt: s.createdAt,
      grade: s.grade,
      attempts: s._count.examAttempts,
      videoViews: s._count.videoViews,
      subscription: s.subscriptions[0] || null,
    })),
  })
}

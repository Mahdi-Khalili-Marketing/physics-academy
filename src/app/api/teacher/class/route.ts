import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/teacher/class — list classes and their students with last-seen & engagement
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const classes = await db.class.findMany({
    where: { teacherId: user.id },
  })

  const result = []
  for (const c of classes) {
    const ids = (c.studentIds as unknown as string[]) || []
    const students = await db.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        avatarColor: true,
      },
    })
    // last activity per student
    const lastAttempts = await db.examAttempt.findMany({
      where: { userId: { in: ids }, isFinished: true },
      orderBy: { finishedAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, finishedAt: true, score: true },
    })
    const lastMap = new Map(lastAttempts.map((a) => [a.userId, a]))
    result.push({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      students: students.map((s) => ({
        ...s,
        lastActive: lastMap.get(s.id)?.finishedAt || null,
        lastScore: lastMap.get(s.id)?.score || null,
      })),
    })
  }
  return NextResponse.json({ classes: result })
}

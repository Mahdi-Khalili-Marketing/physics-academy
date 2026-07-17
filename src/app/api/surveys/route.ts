import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/surveys — submit a one-question post-class survey
// body: { classId, lesson, confused, note }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { classId, lesson, confused, note } = await req.json()
  if (!classId || !lesson) return NextResponse.json({ error: 'اطلاعات ناقص' }, { status: 400 })

  const existing = await db.classSurvey.findUnique({
    where: { classId_userId_lesson: { classId, userId: user.id, lesson } },
  })
  if (existing) {
    return NextResponse.json({ error: 'قبلاً ثبت کرده‌اید.' }, { status: 400 })
  }

  const survey = await db.classSurvey.create({
    data: { classId, userId: user.id, lesson, confused: !!confused, note: note || null },
  })
  return NextResponse.json({ survey })
}

// GET /api/surveys — list surveys (teacher sees their class surveys)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  if (user.role === 'TEACHER') {
    const classes = await db.class.findMany({ where: { teacherId: user.id }, select: { id: true } })
    const ids = classId ? [classId] : classes.map((c) => c.id)
    const surveys = await db.classSurvey.findMany({
      where: { classId: { in: ids } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true } } },
    })
    return NextResponse.json({ surveys })
  }

  if (user.role === 'STUDENT') {
    const surveys = await db.classSurvey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ surveys })
  }

  return NextResponse.json({ surveys: [] })
}

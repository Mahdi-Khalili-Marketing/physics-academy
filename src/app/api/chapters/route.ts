import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/chapters  — list all chapters with topics, for current user's grade
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const chapters = await db.chapter.findMany({
    where: { grade: user.grade },
    orderBy: { order: 'asc' },
    include: {
      topics: { orderBy: { order: 'asc' }, select: { id: true, title: true, slug: true } },
      videos: { select: { id: true, title: true, durationSec: true, topicId: true } },
      _count: { select: { questions: true } },
    },
  })
  return NextResponse.json({ chapters })
}

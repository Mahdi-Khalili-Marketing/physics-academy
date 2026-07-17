import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/student/leitner — list all cards for current user
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const cards = await db.leitnerCard.findMany({
    where: { userId: user.id },
    orderBy: { nextReview: 'asc' },
  })
  const now = new Date()
  return NextResponse.json({
    cards: cards.map((c) => ({ ...c, due: c.nextReview <= now })),
  })
}

// POST /api/student/leitner — create a new card { front, back }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { front, back } = await req.json()
  if (!front || !back) return NextResponse.json({ error: 'متن کارت را کامل کنید.' }, { status: 400 })
  const card = await db.leitnerCard.create({
    data: { userId: user.id, front, back },
  })
  return NextResponse.json({ card })
}

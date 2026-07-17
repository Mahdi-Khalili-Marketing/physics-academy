import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/student/leitner/[id]/review — recall grade { correct: boolean }
// Implements the classic Leitner system:
//   - correct → move up a box (max 7), next review 2^box days later
//   - wrong   → reset to box 1, next review tomorrow
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const { correct } = await req.json()

  const card = await db.leitnerCard.findFirst({ where: { id, userId: user.id } })
  if (!card) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })

  let newBox = card.box
  if (correct) {
    newBox = Math.min(7, card.box + 1)
  } else {
    newBox = 1
  }
  const intervalDays = Math.pow(2, newBox - 1) // box 1 → 1d, box 2 → 2d, box 3 → 4d ...
  const next = new Date()
  next.setDate(next.getDate() + intervalDays)

  const updated = await db.leitnerCard.update({
    where: { id },
    data: { box: newBox, nextReview: next, reviewCount: { increment: 1 } },
  })
  return NextResponse.json({ card: updated })
}

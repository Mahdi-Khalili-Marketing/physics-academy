import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/videos/[id]/view  { watchSec, lastPosition, completed }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params
  const { watchSec = 0, lastPosition = 0, completed = false } = await req.json()

  const view = await db.videoView.upsert({
    where: { videoId_userId: { videoId: id, userId: user.id } },
    update: {
      watchSec: { increment: watchSec },
      lastPosition,
      completed: completed ? true : undefined,
    },
    create: {
      videoId: id,
      userId: user.id,
      watchSec,
      lastPosition,
      completed,
    },
  })
  return NextResponse.json({ ok: true, view })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/videos  — list videos for current user's grade (with view progress)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const chapterId = searchParams.get('chapterId')

  const videos = await db.video.findMany({
    where: {
      isPublished: true,
      chapter: { grade: user.grade },
      ...(chapterId ? { chapterId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      chapter: { select: { id: true, title: true, slug: true } },
      topic: { select: { id: true, title: true, slug: true } },
    },
  })

  // attach user's view progress
  const views = await db.videoView.findMany({
    where: { userId: user.id, videoId: { in: videos.map((v) => v.id) } },
  })
  const viewMap = new Map(views.map((v) => [v.videoId, v]))
  return NextResponse.json({
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      durationSec: v.durationSec,
      hlsUrl: v.hlsUrl,
      chapter: v.chapter,
      topic: v.topic,
      view: viewMap.get(v.id) || null,
    })),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/notifications — list notifications for the current user
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const notifs = await db.notification.findMany({
    where: { OR: [{ scope: 'ALL' }, { userId: user.id }] },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({
    notifications: notifs.map((n) => ({
      ...n,
      read: (n.readIds as unknown as string[])?.includes(user.id) || false,
    })),
  })
}

// POST /api/notifications — manager/teacher creates a notification
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const { title, body, type = 'INFO', scope = 'ALL', userId = null } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'عنوان و متن را وارد کنید.' }, { status: 400 })
  const n = await db.notification.create({
    data: { title, body, type, scope, userId },
  })
  return NextResponse.json({ notification: n })
}

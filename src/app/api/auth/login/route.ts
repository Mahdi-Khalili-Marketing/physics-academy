import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, hashPassword, verifyPassword } from '@/lib/auth'
import { logToOpenObserve } from '@/lib/observability'

// POST /api/auth/login  { phone, password }
export async function POST(req: NextRequest) {
  const { phone, password } = await req.json()
  if (!phone || !password) {
    return NextResponse.json({ error: 'شماره موبایل و رمز عبور را وارد کنید.' }, { status: 400 })
  }
  const user = await db.user.findUnique({ where: { phone: phone.trim() } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    logToOpenObserve({
      level: 'warn',
      event: 'security.auth.login_failed',
      message: 'تلاش ناموفق برای ورود به حساب',
      meta: {
        attemptedPhone: String(phone).slice(0, 7) + '***',
        ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    })
    return NextResponse.json({ error: 'شماره موبایل یا رمز عبور نادرست است.' }, { status: 401 })
  }
  if (!user.isActive) {
    logToOpenObserve({
      level: 'warn',
      event: 'security.auth.inactive_account_blocked',
      userId: user.id,
      role: user.role,
    })
    return NextResponse.json({ error: 'حساب شما غیرفعال است. با مدیریت تماس بگیرید.' }, { status: 403 })
  }
  await createSession(user.id)

  logToOpenObserve({
    level: 'info',
    event: 'security.auth.login_success',
    userId: user.id,
    role: user.role,
    message: `کاربر ${user.name} با نقش ${user.role} وارد سامانه شد`,
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatarColor: user.avatarColor,
      grade: user.grade,
    },
  })
}

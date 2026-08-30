import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { sendSms } from '@/lib/sms'
import { trackEvent } from '@/lib/observability'

// GET /api/manager/students — list all students
export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

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
      spotPlayerLicense: s.spotPlayerLicense,
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

// POST /api/manager/students — manual single student registration
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, phone, parentPhone, spotPlayerLicense, grade, classId, sendWelcomeSms } = body as {
      name: string
      phone: string
      parentPhone?: string
      spotPlayerLicense?: string
      grade?: 'GRADE_11_PHYSICS' | 'GRADE_12_PHYSICS'
      classId?: string
      sendWelcomeSms?: boolean
    }

    if (!name || !phone) {
      return NextResponse.json({ error: 'نام و شماره موبایل دانش‌آموز الزامی است.' }, { status: 400 })
    }

    const cleanPhone = phone.trim().replace(/^98/, '0')
    const cleanParentPhone = parentPhone ? parentPhone.trim().replace(/^98/, '0') : cleanPhone

    const defaultPassword = '1234'
    const passwordHash = hashPassword(defaultPassword)

    const colors = ['#0ea5a4', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981']
    const avatarColor = colors[Math.floor(Math.random() * colors.length)]

    const newStudent = await db.user.upsert({
      where: { phone: cleanPhone },
      update: {
        name: name.trim(),
        parentPhone: cleanParentPhone,
        spotPlayerLicense: spotPlayerLicense?.trim() || undefined,
        grade: grade || 'GRADE_12_PHYSICS',
        isActive: true,
      },
      create: {
        name: name.trim(),
        phone: cleanPhone,
        passwordHash,
        role: 'STUDENT',
        parentPhone: cleanParentPhone,
        spotPlayerLicense: spotPlayerLicense?.trim() || null,
        grade: grade || 'GRADE_12_PHYSICS',
        avatarColor,
        isActive: true,
      },
    })

    // If class assigned
    if (classId) {
      const klass = await db.class.findUnique({ where: { id: classId } })
      if (klass) {
        const studentIds = (klass.studentIds as string[]) || []
        if (!studentIds.includes(newStudent.id)) {
          await db.class.update({
            where: { id: classId },
            data: { studentIds: [...studentIds, newStudent.id] },
          })
        }
      }
    }

    // Optional Welcome SMS
    if (sendWelcomeSms) {
      const licenseMsg = spotPlayerLicense ? `\n🔑 لایسنس اسپات‌پلیر شما:\n${spotPlayerLicense.trim()}` : ''
      sendSms({
        receptor: cleanPhone,
        message: `سلام ${name} عزیز،\nثبت‌نام شما در اردوی فیزیک کنکور انجام شد.\n📲 ورود به پلتفرم و آزمونک‌ها:\n${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}\nشماره: ${cleanPhone}\nرمز: ${defaultPassword}${licenseMsg}`,
      }).catch((e) => console.warn('SMS dispatch error:', e))
    }

    trackEvent('single_student_created', {
      studentId: newStudent.id,
      name: newStudent.name,
      phone: newStudent.phone,
      hasLicense: !!spotPlayerLicense,
      byUser: user.name,
    }, user.id, user.role)

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: `دانش‌آموز ${name} با موفقیت ثبت شد.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ثبت دانش‌آموز' }, { status: 500 })
  }
}

// PATCH /api/manager/students — update student (e.g. SpotPlayer license, active state)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const { studentId, spotPlayerLicense, isActive, parentPhone, grade } = await req.json()
    if (!studentId) {
      return NextResponse.json({ error: 'شناسه دانش‌آموز الزامی است.' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: studentId },
      data: {
        spotPlayerLicense: spotPlayerLicense !== undefined ? (spotPlayerLicense?.trim() || null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        parentPhone: parentPhone !== undefined ? parentPhone?.trim() : undefined,
        grade: grade !== undefined ? grade : undefined,
      },
    })

    return NextResponse.json({ success: true, student: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ویرایش اطلاعات' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { sendSms } from '@/lib/sms'
import { trackEvent } from '@/lib/observability'

type StudentInput = {
  name: string
  phone: string
  parentPhone?: string
  grade?: 'GRADE_11_PHYSICS' | 'GRADE_12_PHYSICS'
  classId?: string
  password?: string
}

function parseCsvStudents(csvText: string): StudentInput[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const students: StudentInput[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip header line if contains 'نام' or 'name'
    if (i === 0 && (line.includes('نام') || line.toLowerCase().includes('name') || line.includes('شماره'))) {
      continue
    }

    // Split by comma, tab, or semicolon
    const parts = line.split(/[,;\t]/).map((p) => p.trim())
    if (parts.length >= 2) {
      const name = parts[0]
      const phone = parts[1].replace(/[\s\-\+]/g, '')
      const parentPhone = parts[2] ? parts[2].replace(/[\s\-\+]/g, '') : undefined
      const grade = parts[3]?.includes('11') || parts[3]?.includes('یازدهم') ? 'GRADE_11_PHYSICS' : 'GRADE_12_PHYSICS'

      if (name && phone.length >= 10) {
        students.push({
          name,
          phone: phone.startsWith('98') ? '0' + phone.slice(2) : phone.startsWith('0') ? phone : '0' + phone,
          parentPhone: parentPhone ? (parentPhone.startsWith('98') ? '0' + parentPhone.slice(2) : parentPhone.startsWith('0') ? parentPhone : '0' + parentPhone) : undefined,
          grade,
        })
      }
    }
  }

  return students
}

// POST /api/manager/students/bulk
// Body: { csvText?: string, students?: StudentInput[], defaultClassId?: string, sendWelcomeSms?: boolean }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const { csvText, students: rawStudents, defaultClassId, sendWelcomeSms } = body as {
    csvText?: string
    students?: StudentInput[]
    defaultClassId?: string
    sendWelcomeSms?: boolean
  }

  let listToProcess: StudentInput[] = []

  if (Array.isArray(rawStudents) && rawStudents.length > 0) {
    listToProcess = rawStudents
  } else if (csvText && csvText.trim()) {
    listToProcess = parseCsvStudents(csvText)
  }

  if (listToProcess.length === 0) {
    return NextResponse.json({
      error: 'هیچ ردیف معتبری در ورودی یافت نشد. لطفاً ساختار (نام، شماره دانش‌آموز، شماره ولی) را بررسی کنید.',
    }, { status: 422 })
  }

  const createdUsers: any[] = []
  const defaultPassword = '1234'
  const defaultPasswordHash = hashPassword(defaultPassword)

  for (const s of listToProcess) {
    const cleanPhone = s.phone.trim().replace(/^98/, '0')
    const passwordHash = s.password ? hashPassword(s.password) : defaultPasswordHash

    const upserted = await db.user.upsert({
      where: { phone: cleanPhone },
      update: {
        name: s.name,
        parentPhone: s.parentPhone || undefined,
        grade: s.grade || 'GRADE_12_PHYSICS',
        isActive: true,
      },
      create: {
        name: s.name,
        phone: cleanPhone,
        passwordHash,
        role: 'STUDENT',
        parentPhone: s.parentPhone || cleanPhone,
        grade: s.grade || 'GRADE_12_PHYSICS',
        avatarColor: '#0ea5a4',
        isActive: true,
      },
    })
    createdUsers.push(upserted)

    // Optional Welcome SMS
    if (sendWelcomeSms) {
      sendSms({
        receptor: cleanPhone,
        message: `سلام ${s.name} عزیز،\nثبت‌نام شما در دوره حضوری فیزیک کنکور انجام شد.\n📲 ورود به پلتفرم هوش مصنوعی و آزمونک‌ها:\n${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}\nشماره شما: ${cleanPhone}\nرمز عبور: ${defaultPassword}`,
      }).catch((e) => console.warn('SMS dispatch error:', e))
    }
  }

  // If default class specified, assign students
  if (defaultClassId) {
    const klass = await db.class.findUnique({ where: { id: defaultClassId } })
    if (klass) {
      const existingIds = (klass.studentIds as string[]) || []
      const mergedIds = Array.from(new Set([...existingIds, ...createdUsers.map((u) => u.id)]))
      await db.class.update({
        where: { id: defaultClassId },
        data: { studentIds: mergedIds },
      })
    }
  }

  trackEvent('bulk_students_imported', {
    count: createdUsers.length,
    byUser: user.name,
    classId: defaultClassId,
  }, user.id, user.role)

  return NextResponse.json({
    success: true,
    totalProcessed: listToProcess.length,
    count: createdUsers.length,
    students: createdUsers.map((u) => ({ id: u.id, name: u.name, phone: u.phone })),
  })
}

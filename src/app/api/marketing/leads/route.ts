import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { trackEvent } from '@/lib/observability'

// POST /api/marketing/leads — Public lead capture from Landing Page AI diagnostic
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, grade, weakTopicTitle, accuracyPct } = body as {
      name: string
      phone: string
      grade?: string
      weakTopicTitle?: string
      accuracyPct?: number
    }

    if (!name || !phone) {
      return NextResponse.json({ error: 'نام و شماره تماس الزامی است.' }, { status: 400 })
    }

    const cleanPhone = phone.trim().replace(/^98/, '0')

    const lead = await db.marketingLead.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        grade: grade || 'دوازدهم',
        weakTopicTitle: weakTopicTitle || 'نامشخص',
        accuracyPct: accuracyPct ?? 0,
        status: 'NEW',
      },
    })

    trackEvent('marketing_lead_captured', {
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      weakTopic: lead.weakTopicTitle,
    })

    return NextResponse.json({
      success: true,
      message: 'درخواست مشاوره و تعیین‌سطح حضوری با موفقیت ثبت شد. مشاورین آموزشگاه با شما تماس خواهند گرفت.',
      leadId: lead.id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ثبت درخواست' }, { status: 500 })
  }
}

// GET /api/marketing/leads — List leads for Manager / Teacher
export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const leads = await db.marketingLead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ leads })
}

// PATCH /api/marketing/leads — Update status (e.g. CALLED, ENROLLED)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'MANAGER' && user.role !== 'TEACHER')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const { id, status, notes } = body as { id: string; status: string; notes?: string }

  const updated = await db.marketingLead.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json({ success: true, lead: updated })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { aiEnabled, chat, type ChatMessage } from '@/lib/ai'

export const maxDuration = 120

const DEMO_ANSWER = `**(پاسخ نمایشی — کلید AI هنوز وصل نشده)**

سؤال خوبی پرسیدی! بیایم قدم‌به‌قدم حلش کنیم:

**قدم ۱ — داده‌ها را بنویس:** سرعت اولیه، شتاب و زمان را از صورت مسئله جدا کن.

**قدم ۲ — فرمول مناسب:** برای حرکت با شتاب ثابت: v = v₀ + at

**قدم ۳ — جای‌گذاری و حل:** اعداد را بگذار و واحدها را چک کن.

💡 نکته کنکوری: قبل از حل، همیشه واحدها را به SI تبدیل کن.

*(با اتصال کلید API، پاسخ واقعی و اختصاصی به همین سؤال داده می‌شود.)*`

// POST /api/ai/tutor  { question, history?: [{role, content}] }
// The 2AM tutor: answers in Persian, step-by-step, grounded in the academy's
// curriculum and the student's own weak topics.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { question, history = [] } = (await req.json()) as {
    question: string
    history?: ChatMessage[]
  }
  if (!question?.trim()) {
    return NextResponse.json({ error: 'سؤال را بنویسید.' }, { status: 400 })
  }

  if (!aiEnabled()) {
    return NextResponse.json({ answer: DEMO_ANSWER, demo: true })
  }

  // Ground the tutor in curriculum + this student's active weaknesses
  const [chapters, prescriptions] = await Promise.all([
    db.chapter.findMany({
      where: { grade: user.grade },
      orderBy: { order: 'asc' },
      include: { topics: { orderBy: { order: 'asc' } } },
    }),
    db.prescription.findMany({
      where: { userId: user.id, status: { not: 'RECOVERED' } },
      include: { topic: true },
      take: 5,
    }),
  ])

  const curriculum = chapters
    .map((c) => `فصل ${c.order}: ${c.title} — مباحث: ${c.topics.map((t) => t.title).join('، ')}`)
    .join('\n')
  const weaknesses = prescriptions.map((p) => p.topic.title).join('، ') || 'ثبت نشده'

  const system = `تو معلم خصوصی فیزیک آموزشگاه هستی و به دانش‌آموزان کنکوری کمک می‌کنی — حتی ۲ نصفه‌شب.

قواعد:
- فقط فارسی جواب بده، روان و صمیمی ولی دقیق.
- هر مسئله را قدم‌به‌قدم حل کن: داده‌ها ← فرمول ← جای‌گذاری ← جواب با واحد.
- روش تدریس آموزشگاه: اول شهود فیزیکی، بعد فرمول. همیشه یک «نکته کنکوری» آخر جواب اضافه کن.
- فرمول‌ها را ساده و خوانا بنویس (مثل v = v₀ + at)، از LaTeX پیچیده پرهیز کن.
- اگر سؤال به فیزیک مربوط نیست، مؤدبانه به فیزیک برگردان.
- اگر سؤال به یکی از ضعف‌های ثبت‌شدهٔ دانش‌آموز مربوط است، اشاره کن که این مبحث در «نسخهٔ» او هست و پیشنهاد بده ویدیوی تجویزشده را ببیند.

سرفصل‌های درس (پایهٔ ${user.grade === 'GRADE_11_PHYSICS' ? 'یازدهم' : 'دوازدهم'}):
${curriculum}

ضعف‌های فعلی این دانش‌آموز (از سیستم تشخیص): ${weaknesses}`

  try {
    const answer = await chat({
      system,
      messages: [...history.slice(-10), { role: 'user', content: question }],
      maxTokens: 2048,
    })
    return NextResponse.json({ answer, demo: false })
  } catch (e) {
    console.error('AI tutor error:', e)
    return NextResponse.json(
      { error: 'ارتباط با معلم هوشمند برقرار نشد. دوباره تلاش کنید.' },
      { status: 502 },
    )
  }
}

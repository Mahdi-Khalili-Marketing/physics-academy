import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { aiEnabled, chat, parseJsonReply } from '@/lib/ai'

export const maxDuration = 120

type Variant = {
  stem: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
}

// POST /api/ai/variants  { questionId, count? }
// The question factory: N fresh versions of a base question with new numbers
// or scenarios, so students can't memorize answers. Nothing is saved here —
// the teacher reviews each variant and saves the good ones.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role === 'STUDENT') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { questionId, count = 5 } = (await req.json()) as { questionId: string; count?: number }
  const question = await db.question.findUnique({
    where: { id: questionId },
    include: { topic: true, chapter: true },
  })
  if (!question) return NextResponse.json({ error: 'سؤال یافت نشد.' }, { status: 404 })

  if (!aiEnabled()) {
    const demoVariants: Variant[] = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      stem: `(نسخهٔ نمایشی ${i + 1}) ${question.stem}`,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
    }))
    return NextResponse.json({ variants: demoVariants, demo: true })
  }

  const system = `تو طراح سؤال کنکور فیزیک هستی. از روی سؤال پایه، ${count} نسخهٔ جدید بساز.

قواعد:
- ساختار فیزیکی و سطح سختی سؤال پایه حفظ شود، اما اعداد یا سناریو عوض شود (مثلاً ماشین ← قطار، ۱۰ متر ← ۲۵ متر).
- اعداد را طوری انتخاب کن که جواب «گرد» و قابل‌حل بدون ماشین‌حساب باشد — سبک کنکور.
- هر نسخه ۴ گزینه داشته باشد و گزینه‌های غلط از خطاهای رایج دانش‌آموزان ساخته شوند.
- جای گزینهٔ صحیح را بین نسخه‌ها تغییر بده.
- محاسبات هر نسخه را قبل از نوشتن گزینه‌ها دقیق انجام بده تا گزینهٔ صحیح واقعاً صحیح باشد.

فقط JSON خالص برگردان، آرایه‌ای با این ساختار و بدون متن اضافه:
[{"stem":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"A|B|C|D"}]`

  const base = `سؤال پایه (فصل: ${question.chapter.title} — مبحث: ${question.topic.title}):
${question.stem}
الف) ${question.optionA}
ب) ${question.optionB}
ج) ${question.optionC}
د) ${question.optionD}
پاسخ صحیح: ${question.correctOption}`

  try {
    const reply = await chat({ system, messages: [{ role: 'user', content: base }], maxTokens: 4096 })
    const variants = parseJsonReply<Variant[]>(reply)
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: 'تولید نسخه‌ها ناموفق بود — دوباره تلاش کنید.' }, { status: 422 })
    }
    const valid = variants.filter(
      (v) =>
        v.stem && v.optionA && v.optionB && v.optionC && v.optionD &&
        ['A', 'B', 'C', 'D'].includes(v.correctOption),
    )
    return NextResponse.json({ variants: valid, demo: false })
  } catch (e) {
    console.error('AI variants error:', e)
    return NextResponse.json({ error: 'خطا در ارتباط با AI.' }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { aiEnabled, chat, parseJsonReply } from '@/lib/ai'

export const maxDuration = 60

// POST /api/ai/tag  { stem, options?: {A,B,C,D} }
// Auto-tag a pasted question: which chapter, which topic, how hard.
// The teacher only reviews and hits save.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role === 'STUDENT') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { stem, options } = (await req.json()) as {
    stem: string
    options?: { A?: string; B?: string; C?: string; D?: string }
  }
  if (!stem?.trim()) {
    return NextResponse.json({ error: 'متن سؤال خالی است.' }, { status: 400 })
  }

  const chapters = await db.chapter.findMany({
    orderBy: { order: 'asc' },
    include: { topics: { orderBy: { order: 'asc' } } },
  })

  // Demo mode: naive keyword match against topic titles so the flow is testable
  if (!aiEnabled()) {
    const flat = chapters.flatMap((c) => c.topics.map((t) => ({ c, t })))
    const hit =
      flat.find(({ t }) => t.title.split(/\s+/).some((w) => w.length > 2 && stem.includes(w))) ??
      flat[0]
    if (!hit) return NextResponse.json({ error: 'سرفصلی ثبت نشده است.' }, { status: 400 })
    return NextResponse.json({
      chapterId: hit.c.id,
      topicId: hit.t.id,
      difficulty: 'MEDIUM',
      demo: true,
    })
  }

  const catalog = chapters
    .map(
      (c) =>
        `chapterId=${c.id} «${c.title}»\n` +
        c.topics.map((t) => `  topicId=${t.id} «${t.title}»`).join('\n'),
    )
    .join('\n')

  const system = `تو دستیار دبیر فیزیک هستی. سؤال چهارگزینه‌ای را بخوان و دقیق‌ترین فصل و مبحث را از فهرست زیر انتخاب کن و سختی را برآورد کن.

فهرست فصل‌ها و مباحث:
${catalog}

فقط JSON خالص با این ساختار برگردان، بدون هیچ متن اضافه:
{"chapterId": "...", "topicId": "...", "difficulty": "EASY|MEDIUM|HARD"}
topicId باید متعلق به همان chapterId باشد.`

  const optText = options
    ? `\nگزینه‌ها:\nالف) ${options.A ?? ''}\nب) ${options.B ?? ''}\nج) ${options.C ?? ''}\nد) ${options.D ?? ''}`
    : ''

  try {
    const reply = await chat({
      system,
      messages: [{ role: 'user', content: `سؤال:\n${stem}${optText}` }],
      maxTokens: 300,
    })
    const parsed = parseJsonReply<{ chapterId: string; topicId: string; difficulty: string }>(reply)
    const chapter = chapters.find((c) => c.id === parsed?.chapterId)
    const topic = chapter?.topics.find((t) => t.id === parsed?.topicId)
    if (!parsed || !chapter || !topic) {
      return NextResponse.json({ error: 'تشخیص خودکار ناموفق بود — دستی انتخاب کنید.' }, { status: 422 })
    }
    const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(parsed.difficulty)
      ? parsed.difficulty
      : 'MEDIUM'
    return NextResponse.json({ chapterId: chapter.id, topicId: topic.id, difficulty, demo: false })
  } catch (e) {
    console.error('AI tag error:', e)
    return NextResponse.json({ error: 'خطا در ارتباط با AI.' }, { status: 502 })
  }
}

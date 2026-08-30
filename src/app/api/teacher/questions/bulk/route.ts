import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type ParsedQuestion = {
  stem: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  chapterId?: string
  topicId?: string
}

function parseRawQuestionBlock(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  // Split by question markers like: "1-", "۱-", "سوال ۱:", "سؤال ۲:", "1.", "۱."
  const chunks = text.split(/(?:^|\n)(?:\d+|[۰-۹]+)[\.\-\:\)]|(?:\n|^)(?:سؤال|سوال)\s*(?:\d+|[۰-۹]+)[\.\:\-]?/i).filter((c) => c.trim().length > 15)

  for (const chunk of chunks) {
    const lines = chunk.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // Find options: (1 / ۱ / الف) , (2 / ۲ / ب) , (3 / ۳ / ج) , (4 / ۴ / د)
    let stemLines: string[] = []
    let optA = ''
    let optB = ''
    let optC = ''
    let optD = ''
    let correct: 'A' | 'B' | 'C' | 'D' = 'A'

    for (const line of lines) {
      // Check for answer key marker: "پاسخ: ۱" or "گزینه: ج" or "کلید: 2"
      const ansMatch = line.match(/(?:پاسخ|گزینه|کلید|جواب)\s*(?:صحیح)?[\:\=]?\s*([1-4]|[۱-۴]|[الف|ب|ج|د|A-D])/i)
      if (ansMatch) {
        const val = ansMatch[1]
        if (['1', '۱', 'الف', 'A', 'a'].includes(val)) correct = 'A'
        else if (['2', '۲', 'ب', 'B', 'b'].includes(val)) correct = 'B'
        else if (['3', '۳', 'ج', 'C', 'c'].includes(val)) correct = 'C'
        else if (['4', '۴', 'د', 'D', 'd'].includes(val)) correct = 'D'
        continue
      }

      // Check for Option 1 / الف
      const aMatch = line.match(/^(?:[1۱الفA]\s*[\)\.\-\:]|[الف]\))\s*(.+)/i)
      if (aMatch) {
        optA = aMatch[1].trim()
        continue
      }

      // Check for Option 2 / ب
      const bMatch = line.match(/^(?:[2۲بB]\s*[\)\.\-\:]|[ب]\))\s*(.+)/i)
      if (bMatch) {
        optB = bMatch[1].trim()
        continue
      }

      // Check for Option 3 / ج
      const cMatch = line.match(/^(?:[3۳جC]\s*[\)\.\-\:]|[ج]\))\s*(.+)/i)
      if (cMatch) {
        optC = cMatch[1].trim()
        continue
      }

      // Check for Option 4 / د
      const dMatch = line.match(/^(?:[4۴دD]\s*[\)\.\-\:]|[د]\))\s*(.+)/i)
      if (dMatch) {
        optD = dMatch[1].trim()
        continue
      }

      if (!optA && !optB && !optC && !optD) {
        stemLines.push(line)
      }
    }

    const stem = stemLines.join('\n').trim()
    if (stem && optA && optB && optC && optD) {
      questions.push({
        stem,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctOption: correct,
        difficulty: 'MEDIUM',
      })
    }
  }

  return questions
}

// POST /api/teacher/questions/bulk
// Body: { rawText?: string, questions?: ParsedQuestion[], defaultChapterId, defaultTopicId }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const { rawText, questions: inputQuestions, defaultChapterId, defaultTopicId } = body as {
    rawText?: string
    questions?: ParsedQuestion[]
    defaultChapterId: string
    defaultTopicId: string
  }

  if (!defaultChapterId || !defaultTopicId) {
    return NextResponse.json({ error: 'فصل و مبحث پیش‌فرض الزامی است.' }, { status: 400 })
  }

  let itemsToInsert: ParsedQuestion[] = []

  if (inputQuestions && Array.isArray(inputQuestions) && inputQuestions.length > 0) {
    itemsToInsert = inputQuestions
  } else if (rawText && rawText.trim()) {
    itemsToInsert = parseRawQuestionBlock(rawText)
  }

  if (itemsToInsert.length === 0) {
    return NextResponse.json({
      error: 'هیچ سؤالی در متن واردشده شناسایی نشد. لطفاً ساختار سوالات و ۴ گزینه را بررسی کنید.',
    }, { status: 422 })
  }

  // Insert in batch
  const created = await db.$transaction(
    itemsToInsert.map((q) =>
      db.question.create({
        data: {
          chapterId: q.chapterId || defaultChapterId,
          topicId: q.topicId || defaultTopicId,
          stem: q.stem,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          difficulty: q.difficulty || 'MEDIUM',
          authoredById: user.id,
          approvedById: user.id,
          approvalStatus: 'APPROVED',
        },
      }),
    ),
  )

  return NextResponse.json({
    success: true,
    count: created.length,
    questions: created,
  })
}

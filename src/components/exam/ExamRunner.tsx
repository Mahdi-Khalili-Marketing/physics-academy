'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Brain,
  PlayCircle,
  RefreshCcw,
  BookOpen,
} from 'lucide-react'
import { toFa, toFaNumber, formatDuration } from '@/lib/fa'
import { examTypeLabel } from '@/components/student/StudentDashboard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ExamData = {
  exam: {
    id: string
    title: string
    type: string
    durationMin: number
    questionCount: number
    chapter: { id: string; title: string } | null
    questions: {
      id: string
      stem: string
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      difficulty: string
      topicId: string
      topic: { id: string; title: string; slug: string }
    }[]
  }
}

type ExamList = {
  exams: {
    id: string
    title: string
    type: string
    durationMin: number
    questionCount: number
    chapter: { id: string; title: string } | null
    attempts: {
      id: string
      score: number
      correctCount: number
      wrongCount: number
      blankCount: number
      isFinished: boolean
      finishedAt: string | null
    }[]
  }[]
}

type SubmitResult = {
  attempt: {
    id: string
    score: number
    correctCount: number
    wrongCount: number
    blankCount: number
    durationSec: number
  }
  diagnosis: { topicId: string; topicTitle: string; wrong: number; total: number }[]
  prescription: { topicId: string; topicTitle: string; videoId: string; videoTitle: string }[]
}

export function ExamRunner({ examId, onExit, onViewLibrary }: { examId: string; onExit: () => void; onViewLibrary: (videoId?: string) => void }) {
  const [exam, setExam] = useState<ExamData['exam'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSec: number }>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const questionStartRef = useRef<number>(Date.now())

  // Load exam
  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((r) => r.json())
      .then((d: ExamData) => {
        setExam(d.exam)
        setTimeLeft(d.exam.durationMin * 60)
      })
      .finally(() => setLoading(false))
  }, [examId])

  // Start attempt
  async function startAttempt() {
    const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' })
    const data = await res.json()
    setAttemptId(data.attemptId)
    setStarted(true)
    questionStartRef.current = Date.now()
  }

  // Timer
  useEffect(() => {
    if (!started || result) return
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          submit(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [started, result])

  const recordTime = useCallback(() => {
    const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
    return elapsed
  }, [])

  function selectAnswer(qId: string, option: 'A' | 'B' | 'C' | 'D' | null) {
    const elapsed = recordTime()
    setAnswers((prev) => {
      const existing = prev[qId] || { selected: null, timeSpentSec: 0 }
      return {
        ...prev,
        [qId]: {
          selected: option,
          timeSpentSec: existing.timeSpentSec + (existing.selected === null ? elapsed : 5),
        },
      }
    })
  }

  function goNext() {
    if (!exam) return
    // commit time spent on current
    const q = exam.questions[currentIdx]
    if (q) {
      const elapsed = recordTime()
      setAnswers((prev) => ({
        ...prev,
        [q.id]: {
          selected: prev[q.id]?.selected ?? null,
          timeSpentSec: (prev[q.id]?.timeSpentSec || 0) + elapsed,
        },
      }))
    }
    if (currentIdx < exam.questions.length - 1) {
      setCurrentIdx((i) => i + 1)
      questionStartRef.current = Date.now()
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1)
      questionStartRef.current = Date.now()
    }
  }

  async function submit(auto = false) {
    if (!exam || !attemptId) return
    setSubmitting(true)
    // commit current question time
    const q = exam.questions[currentIdx]
    if (q) {
      const elapsed = recordTime()
      setAnswers((prev) => ({
        ...prev,
        [q.id]: {
          selected: prev[q.id]?.selected ?? null,
          timeSpentSec: (prev[q.id]?.timeSpentSec || 0) + elapsed,
        },
      }))
    }

    const payload = {
      attemptId,
      answers: exam.questions.map((qq) => ({
        questionId: qq.id,
        selected: answers[qq.id]?.selected ?? null,
        timeSpentSec: answers[qq.id]?.timeSpentSec ?? 0,
      })),
    }

    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در ثبت آزمون')
        return
      }
      setResult(data)
      if (auto) toast.info('زمان آزمون تمام شد — پاسخ‌ها ثبت شدند.')
      else toast.success('آزمون ثبت شد!')
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  if (!exam) return <div>آزمون یافت نشد.</div>

  // ============ RESULT VIEW ============
  if (result) {
    return <ExamResult result={result} exam={exam} onExit={onExit} onViewLibrary={onViewLibrary} />
  }

  // ============ PRE-START VIEW ============
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto page-enter">
        <Card>
          <CardHeader className="text-center space-y-2">
            <Badge variant="outline" className="mx-auto w-fit">{examTypeLabel(exam.type)}</Badge>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            {exam.chapter && <CardDescription>فصل: {exam.chapter.title}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-4">
                <Target className="h-5 w-5 mx-auto text-teal-600 mb-1" />
                <div className="text-2xl font-bold">{toFa(exam.questions.length)}</div>
                <div className="text-xs text-muted-foreground">سؤال</div>
              </div>
              <div className="rounded-lg border p-4">
                <Clock className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <div className="text-2xl font-bold">{toFa(exam.durationMin)}</div>
                <div className="text-xs text-muted-foreground">دقیقه</div>
              </div>
              <div className="rounded-lg border p-4">
                <Brain className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <div className="text-2xl font-bold">{toFaNumber((exam.durationMin * 60) / exam.questions.length, 0)}</div>
                <div className="text-xs text-muted-foreground">ثانیه/سؤال</div>
              </div>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-sm">
              <div className="font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                راهنمای آزمون
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• آزمون با رتبه‌بندی کنکور تصحیح می‌شود: هر ۳ غلط، ۱ صحیح را حذف می‌کند.</li>
                <li>• می‌توانید بین سؤال‌ها جابجا شوید و در پایان پاسخ‌ها را ثبت کنید.</li>
                <li>• پس از ثبت، موتور تحلیل هوشمند، نقشه ضعف‌ها و مسیر درمان را نشان می‌دهد.</li>
                <li>• در صورت اتمام زمان، پاسخ‌ها به‌صورت خودکار ثبت می‌شوند.</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={startAttempt} className="flex-1 gap-2">
                <PlayCircle className="h-4 w-4" /> شروع آزمون
              </Button>
              <Button onClick={onExit} variant="outline">انصراف</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============ EXAM TAKING VIEW ============
  const q = exam.questions[currentIdx]
  const answered = Object.values(answers).filter((a) => a.selected !== null).length
  const progressPct = (answered / exam.questions.length) * 100

  return (
    <div className="space-y-4 page-enter max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 sticky top-16 z-10 bg-background/80 backdrop-blur p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{examTypeLabel(exam.type)}</Badge>
          <span className="text-sm font-medium hidden sm:inline">{exam.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-3 py-1 rounded-lg font-mono', timeLeft < 60 ? 'bg-red-500/15 text-red-600' : 'bg-muted')}>
            <Clock className="h-4 w-4" />
            {formatDuration(timeLeft)}
          </div>
          <Button onClick={() => submit(false)} disabled={submitting} className="gap-2">
            <Flag className="h-4 w-4" /> ثبت نهایی
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-4">
        {/* Question card */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                سؤال {toFa(currentIdx + 1)} از {toFa(exam.questions.length)} · مبحث: {q.topic.title}
              </div>
              <Badge variant="secondary" className="text-[10px]">{difficultyLabel(q.difficulty)}</Badge>
            </div>
            <div className="text-lg leading-relaxed font-medium">{q.stem}</div>
            <RadioGroup
              value={answers[q.id]?.selected ?? ''}
              onValueChange={(v) => selectAnswer(q.id, v as 'A' | 'B' | 'C' | 'D')}
              className="space-y-2"
            >
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const text = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']
                const selected = answers[q.id]?.selected === opt
                return (
                  <Label
                    key={opt}
                    htmlFor={`q-${q.id}-${opt}`}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-teal-500/50 hover:bg-teal-500/5',
                      selected && 'border-teal-500 bg-teal-500/10',
                    )}
                  >
                    <RadioGroupItem value={opt} id={`q-${q.id}-${opt}`} className="mt-1" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-teal-600 ml-2">{opt}.</span>
                      <span>{text}</span>
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="ghost" onClick={goPrev} disabled={currentIdx === 0} className="gap-1">
                <ChevronRight className="h-4 w-4" /> قبلی
              </Button>
              <Button
                variant="ghost"
                onClick={() => selectAnswer(q.id, null)}
                className="gap-1 text-amber-600"
              >
                <MinusCircle className="h-4 w-4" /> بدون پاسخ
              </Button>
              {currentIdx < exam.questions.length - 1 ? (
                <Button onClick={goNext} className="gap-1">
                  بعدی <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => submit(false)} disabled={submitting} className="gap-2">
                  <Flag className="h-4 w-4" /> ثبت
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side nav */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">نقشه سؤالات</CardTitle>
            <Progress value={progressPct} className="h-1.5" />
            <div className="text-xs text-muted-foreground">{toFa(answered)} از {toFa(exam.questions.length)} پاسخ داده شده</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((qq, i) => {
                const a = answers[qq.id]
                const isCurrent = i === currentIdx
                const isAnswered = a?.selected !== null && a?.selected !== undefined
                return (
                  <button
                    key={qq.id}
                    onClick={() => { setCurrentIdx(i); questionStartRef.current = Date.now() }}
                    className={cn(
                      'aspect-square rounded-md text-sm font-medium border transition-all',
                      isCurrent && 'ring-2 ring-teal-500',
                      isAnswered ? 'bg-teal-500/15 border-teal-500/40 text-teal-700' : 'bg-muted border-transparent',
                    )}
                  >
                    {toFa(i + 1)}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function difficultyLabel(d: string) {
  switch (d) {
    case 'EASY': return 'آسان'
    case 'MEDIUM': return 'متوسط'
    case 'HARD': return 'سخت'
    default: return d
  }
}

// ============ EXAM RESULT VIEW ============
function ExamResult({ result, exam, onExit, onViewLibrary }: { result: SubmitResult; exam: ExamData['exam']; onExit: () => void; onViewLibrary: (videoId?: string) => void }) {
  const { attempt, diagnosis, prescription } = result
  const scoreColor = attempt.score >= 14 ? 'text-emerald-600' : attempt.score >= 10 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="max-w-3xl mx-auto page-enter space-y-6">
      <Card className="border-0 hero-gradient">
        <CardContent className="p-8 text-center">
          <div className="text-sm text-muted-foreground mb-2">{exam.title}</div>
          <div className={cn('text-6xl font-bold', scoreColor)}>{toFaNumber(attempt.score)}</div>
          <div className="text-muted-foreground mt-1">از ۲۰</div>
          <div className="flex justify-center gap-4 mt-6">
            <Stat icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="صحیح" value={toFa(attempt.correctCount)} />
            <Stat icon={<XCircle className="h-4 w-4 text-red-600" />} label="غلط" value={toFa(attempt.wrongCount)} />
            <Stat icon={<MinusCircle className="h-4 w-4 text-amber-600" />} label="نزده" value={toFa(attempt.blankCount)} />
            <Stat icon={<Clock className="h-4 w-4 text-muted-foreground" />} label="زمان" value={formatDuration(attempt.durationSec)} />
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            تشخیص — ریشه هر غلط
          </CardTitle>
          <CardDescription>مباحثی که در آن‌ها ضعف داشتید</CardDescription>
        </CardHeader>
        <CardContent>
          {diagnosis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <p>ضعف قابل‌توجهی شناسایی نشد. آفرین!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnosis.map((d) => {
                const pct = Math.round((d.wrong / d.total) * 100)
                return (
                  <div key={d.topicId} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex-1">
                      <div className="font-medium">{d.topicTitle}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {toFa(d.wrong)} غلط از {toFa(d.total)} پاسخ
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-red-600">{toFa(pct)}٪</div>
                      <div className="text-[10px] text-muted-foreground">خطا</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription */}
      {prescription.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              تجویز — مسیر رفع ضعف
            </CardTitle>
            <CardDescription>برای رفع هر ضعف، درس مرتبط را ببینید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {prescription.map((p) => (
              <div key={p.topicId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                <BookOpen className="h-5 w-5 text-teal-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{p.videoTitle}</div>
                  <div className="text-xs text-muted-foreground">برای رفع ضعف در: {p.topicTitle}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onViewLibrary(p.videoId)} className="gap-1">
                  مشاهده <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loop hint */}
      <div className="rounded-lg bg-teal-500/10 border border-teal-500/30 p-4 text-sm flex items-start gap-3">
        <RefreshCcw className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-teal-700 dark:text-teal-300">چرخه تسلط</div>
          <div className="text-muted-foreground mt-1">
            پس از دیدن ویدیوهای تجویزشده، دوباره این آزمون را بدهید تا از رفع ضعف مطمئن شوید.
            این چرخه تا رسیدن به تسلط تکرار می‌شود.
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onExit} variant="outline" className="gap-2">
          <ChevronRight className="h-4 w-4" /> بازگشت به فهرست آزمون‌ها
        </Button>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      <div className="font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ============ EXAM LIST VIEW ============
export function ExamList({ onOpen, onBack }: { onOpen: (id: string) => void; onBack: () => void }) {
  const [data, setData] = useState<ExamList | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'TOPIC_QUIZ' | 'CHAPTER_EXAM' | 'KONKUR_SIM'>('ALL')

  useEffect(() => {
    fetch('/api/exams')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />
  if (!data) return null

  const filtered = filter === 'ALL' ? data.exams : data.exams.filter((e) => e.type === filter)
  const grouped: Record<string, typeof filtered> = {}
  for (const e of filtered) {
    const k = e.chapter?.title || 'عمومی'
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(e)
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">آزمون‌ها</h1>
          <p className="text-muted-foreground text-sm mt-1">آزمونک موضوعی، آزمون جامع فصل و شبیه‌ساز کنکور</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['ALL', 'همه'],
          ['TOPIC_QUIZ', 'آزمونک موضوعی'],
          ['CHAPTER_EXAM', 'آزمون جامع فصل'],
          ['KONKUR_SIM', 'شبیه‌ساز کنکور'],
        ] as const).map(([k, l]) => (
          <Button
            key={k}
            variant={filter === k ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(k)}
          >
            {l}
          </Button>
        ))}
      </div>

      {Object.entries(grouped).map(([chapter, exams]) => (
        <div key={chapter} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{chapter}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((e) => {
              const lastAttempt = e.attempts[0]
              return (
                <Card
                  key={e.id}
                  className="hover-lift cursor-pointer"
                  onClick={() => onOpen(e.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-[10px]">{examTypeLabel(e.type)}</Badge>
                      {lastAttempt && (
                        <span className={`text-sm font-bold ${lastAttempt.score >= 14 ? 'text-emerald-600' : lastAttempt.score >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                          {toFaNumber(lastAttempt.score)}
                        </span>
                      )}
                    </div>
                    <div className="font-medium leading-snug">{e.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />{toFa(e.questionCount)} سؤال</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{toFa(e.durationMin)} دقیقه</span>
                    </div>
                    {e.attempts.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        {toFa(e.attempts.length)} попытка · آخرین: {relativeTimeShort(e.attempts[0].finishedAt)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function relativeTimeShort(date: string | null) {
  if (!date) return ''
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const day = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (day < 1) return 'امروز'
  if (day < 7) return `${toFa(day)} روز پیش`
  if (day < 30) return `${toFa(Math.floor(day / 7))} هفته پیش`
  return `${toFa(Math.floor(day / 30))} ماه پیش`
}

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
  Bookmark,
  ListFilter,
  Zap,
} from 'lucide-react'
import { toFa, toFaNumber, formatDuration } from '@/lib/fa'
import { examTypeLabel } from '@/components/student/StudentDashboard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { MathText } from '@/components/shared/MathText'

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
  diagnosis: { topicId: string; topicTitle: string; wrong: number; blank: number; total: number }[]
  prescription: { prescriptionId: string; topicId: string; topicTitle: string; videoId: string; videoTitle: string; reason: string }[]
  remedial: { prescriptionId: string; passed: boolean; ratio: number } | null
}

export function ExamRunner({ examId, onExit, onViewLibrary, onOpenExam }: { examId: string; onExit: () => void; onViewLibrary: (videoId?: string) => void; onOpenExam?: (id: string) => void }) {
  const [exam, setExam] = useState<ExamData['exam'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSec: number }>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [sidebarTab, setSidebarTab] = useState<'omr' | 'grid'>('omr')
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'answered' | 'unanswered' | 'flagged'>('all')
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

  // Restore draft if exists
  useEffect(() => {
    if (!examId) return
    try {
      const raw = localStorage.getItem(`exam_draft_${examId}`)
      if (raw) {
        const draft = JSON.parse(raw)
        // Only restore if draft is less than 24 hours old
        if (draft.attemptId && draft.answers && Date.now() - draft.timestamp < 86400000) {
          setAttemptId(draft.attemptId)
          setAnswers(draft.answers)
          if (draft.flagged) setFlagged(draft.flagged)
          if (typeof draft.currentIdx === 'number') setCurrentIdx(draft.currentIdx)
          setStarted(true)
          toast.info('پاسخ‌های ثبت‌شده قبلی از حافظه مرورگر بازیابی شدند.')
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [examId])

  // Auto-save draft answers to localStorage
  useEffect(() => {
    if (!started || !attemptId || !examId) return
    try {
      localStorage.setItem(`exam_draft_${examId}`, JSON.stringify({
        attemptId,
        answers,
        flagged,
        currentIdx,
        timestamp: Date.now(),
      }))
    } catch {
      // ignore storage quota errors
    }
  }, [started, attemptId, examId, answers, flagged, currentIdx])

  // Listen to network status
  useEffect(() => {
    function handleOffline() {
      toast.warning('اتصال اینترنت قطع شد! پاسخ‌های شما به صورت امن در مرورگر نگهداری می‌شوند.')
    }
    function handleOnline() {
      toast.success('اتصال اینترنت مجدداً برقرار شد.')
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

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
    
    // commit current active question time synchronously into payload to avoid state lag
    const q = exam.questions[currentIdx]
    let currentAnswers = answers
    if (q) {
      const elapsed = recordTime()
      currentAnswers = {
        ...answers,
        [q.id]: {
          selected: answers[q.id]?.selected ?? null,
          timeSpentSec: (answers[q.id]?.timeSpentSec || 0) + elapsed,
        },
      }
      setAnswers(currentAnswers)
    }

    const payload = {
      attemptId,
      answers: exam.questions.map((qq) => ({
        questionId: qq.id,
        selected: currentAnswers[qq.id]?.selected ?? null,
        timeSpentSec: currentAnswers[qq.id]?.timeSpentSec ?? 0,
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
      // Clear offline draft on successful submission
      try {
        localStorage.removeItem(`exam_draft_${examId}`)
      } catch {
        // ignore
      }
      setResult(data)
      if (auto) toast.info('زمان آزمون تمام شد — پاسخ‌ها ثبت شدند.')
      else toast.success('آزمون ثبت شد!')
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور. پاسخ‌های شما ذخیره شده‌اند، لطفاً مجدداً دکمه ثبت را بزنید.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  if (!exam) return <div>آزمون یافت نشد.</div>

  // ============ RESULT VIEW ============
  if (result) {
    return <ExamResult result={result} exam={exam} onExit={onExit} onViewLibrary={onViewLibrary} onOpenExam={onOpenExam} />
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
                <Target className="h-5 w-5 mx-auto text-primary mb-1" />
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
  const flaggedCount = Object.values(flagged).filter(Boolean).length
  const progressPct = (answered / exam.questions.length) * 100

  // Calculate speed telemetry
  const totalSpentSec = Object.values(answers).reduce((s, a) => s + (a.timeSpentSec || 0), 0)
  const avgSecPerQ = answered > 0 ? Math.round(totalSpentSec / answered) : 0

  const filteredQuestions = exam.questions.map((qq, idx) => ({ ...qq, originalIndex: idx })).filter((qq) => {
    const isAns = answers[qq.id]?.selected !== null && answers[qq.id]?.selected !== undefined
    const isFlag = !!flagged[qq.id]
    if (sidebarFilter === 'answered') return isAns
    if (sidebarFilter === 'unanswered') return !isAns
    if (sidebarFilter === 'flagged') return isFlag
    return true
  })

  return (
    <div className="space-y-4 page-enter max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 sticky top-16 z-20 glass-panel p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
            {examTypeLabel(exam.type)}
          </Badge>
          <span className="text-sm font-bold hidden sm:inline">{exam.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors',
              timeLeft < 60
                ? 'bg-red-500/20 text-red-600 border-red-500/40 animate-pulse status-dot-red'
                : timeLeft < 180
                ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                : 'bg-muted/80 border-border/60',
            )}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatDuration(timeLeft)}</span>
          </div>
          <Button onClick={() => submit(false)} disabled={submitting} size="sm" className="gap-1.5 shadow-xs text-xs font-bold">
            <Flag className="h-3.5 w-3.5" />
            <span>ثبت نهایی آزمون</span>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Question card */}
        <Card className="glass-card shadow-sm border-primary/20">
          <CardContent className="p-6 sm:p-7 space-y-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  {toFa(currentIdx + 1)}
                </span>
                <span>از {toFa(exam.questions.length)} سوال · مبحث: {q.topic.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={flagged[q.id] ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className={cn(
                    'gap-1.5 text-xs h-7 px-2.5 rounded-lg transition-colors',
                    flagged[q.id] ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : 'text-muted-foreground',
                  )}
                >
                  <Bookmark className={cn('h-3.5 w-3.5', flagged[q.id] && 'fill-current')} />
                  <span>{flagged[q.id] ? 'شک‌دار (علامت‌زده)' : 'علامت‌گذاری شک‌دار'}</span>
                </Button>
                <Badge variant="secondary" className="text-[10px] font-semibold">{difficultyLabel(q.difficulty)}</Badge>
              </div>
            </div>

            <MathText text={q.stem} as="div" className="text-base sm:text-lg leading-relaxed font-semibold text-foreground" />

            <RadioGroup
              value={answers[q.id]?.selected ?? ''}
              onValueChange={(v) => selectAnswer(q.id, v as 'A' | 'B' | 'C' | 'D')}
              className="space-y-2.5 pt-2"
            >
              {(['A', 'B', 'C', 'D'] as const).map((opt, optIdx) => {
                const text = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']
                const selected = answers[q.id]?.selected === opt
                return (
                  <Label
                    key={opt}
                    htmlFor={`q-${q.id}-${opt}`}
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all card-interactive',
                      selected
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border/70 bg-card hover:bg-muted/40',
                    )}
                  >
                    <RadioGroupItem value={opt} id={`q-${q.id}-${opt}`} className="mt-1" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-primary ml-2">{toFa(optIdx + 1)}.</span>
                      <MathText text={text} />
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIdx === 0} className="gap-1 text-xs">
                <ChevronRight className="h-4 w-4" /> سوال قبلی
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectAnswer(q.id, null)}
                className="gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
              >
                <MinusCircle className="h-3.5 w-3.5" /> پاک کردن پاسخ
              </Button>
              {currentIdx < exam.questions.length - 1 ? (
                <Button size="sm" onClick={goNext} className="gap-1 text-xs font-bold shadow-xs">
                  سوال بعدی <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => submit(false)} disabled={submitting} className="gap-1.5 text-xs font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700">
                  <Flag className="h-3.5 w-3.5" /> پایان و ثبت
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side nav: Digital OMR + Question Matrix */}
        <Card className="glass-card shadow-sm border-primary/20 h-fit space-y-3 p-3.5">
          {/* Progress Header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>پیشرفت پاسخگویی</span>
              <span className="text-primary font-mono">{toFa(answered)} / {toFa(exam.questions.length)}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSidebarTab('omr')}
              className={cn(
                'py-1.5 rounded-lg text-center transition-all cursor-pointer',
                sidebarTab === 'omr' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground',
              )}
            >
              پاسخ‌برگ حبابی
            </button>
            <button
              onClick={() => setSidebarTab('grid')}
              className={cn(
                'py-1.5 rounded-lg text-center transition-all cursor-pointer',
                sidebarTab === 'grid' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground',
              )}
            >
              ماتریس سوالات
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center justify-between gap-1 text-[10px] pb-1 border-b border-border/50">
            <button
              onClick={() => setSidebarFilter('all')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors',
                sidebarFilter === 'all' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              همه ({toFa(exam.questions.length)})
            </button>
            <button
              onClick={() => setSidebarFilter('answered')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors',
                sidebarFilter === 'answered' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              پاسخ‌داده ({toFa(answered)})
            </button>
            <button
              onClick={() => setSidebarFilter('flagged')}
              className={cn(
                'px-2 py-0.5 rounded-md transition-colors flex items-center gap-0.5',
                sidebarFilter === 'flagged' ? 'bg-amber-500 text-white font-bold' : 'text-amber-600 hover:bg-amber-500/10',
              )}
            >
              <Bookmark className="h-2.5 w-2.5 fill-current" />
              <span>({toFa(flaggedCount)})</span>
            </button>
          </div>

          {/* Tab 1: Digital OMR Bubble Sheet */}
          {sidebarTab === 'omr' ? (
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
              {filteredQuestions.map((qq) => {
                const i = qq.originalIndex
                const isCurrent = i === currentIdx
                const isFlagged = !!flagged[qq.id]
                const selectedOpt = answers[qq.id]?.selected

                return (
                  <div
                    key={qq.id}
                    className={cn(
                      'flex items-center justify-between p-1.5 rounded-xl border transition-all text-xs',
                      isCurrent
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border/60 bg-card hover:bg-muted/30',
                    )}
                  >
                    <button
                      onClick={() => { setCurrentIdx(i); questionStartRef.current = Date.now() }}
                      className="font-bold w-6 text-center text-muted-foreground hover:text-foreground"
                    >
                      {toFa(i + 1)}
                    </button>

                    <div className="flex items-center gap-1">
                      {(['A', 'B', 'C', 'D'] as const).map((opt, optIdx) => {
                        const isChosen = selectedOpt === opt
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              selectAnswer(qq.id, opt)
                              setCurrentIdx(i)
                              questionStartRef.current = Date.now()
                            }}
                            className={cn(
                              'h-5 w-5 rounded-full text-[10px] font-bold border transition-all flex items-center justify-center cursor-pointer',
                              isChosen
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-muted/40 border-border/80 hover:border-primary/50 text-muted-foreground',
                            )}
                          >
                            {toFa(optIdx + 1)}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setFlagged((prev) => ({ ...prev, [qq.id]: !prev[qq.id] }))}
                      className="p-1 text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Bookmark className={cn('h-3.5 w-3.5', isFlagged ? 'text-amber-500 fill-current' : 'opacity-30')} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Tab 2: Question Matrix Grid */
            <div className="grid grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredQuestions.map((qq) => {
                const i = qq.originalIndex
                const a = answers[qq.id]
                const isCurrent = i === currentIdx
                const isAnswered = a?.selected !== null && a?.selected !== undefined
                const isFlagged = !!flagged[qq.id]

                return (
                  <button
                    key={qq.id}
                    onClick={() => { setCurrentIdx(i); questionStartRef.current = Date.now() }}
                    className={cn(
                      'aspect-square rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center relative cursor-pointer',
                      isCurrent && 'ring-2 ring-primary',
                      isAnswered
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-muted/40 border-border/60 text-muted-foreground',
                    )}
                  >
                    <span>{toFa(i + 1)}</span>
                    {isFlagged && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Speed Telemetry Box (Konkoor 74s Benchmark) */}
          <div className="pt-2 border-t border-border/60 space-y-1 text-[11px] text-muted-foreground bg-primary/5 rounded-xl p-2.5">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1 text-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                سرعت پاسخگویی:
              </span>
              <span className="font-mono font-bold text-primary">{toFa(avgSecPerQ)} ثانیه / تست</span>
            </div>
            <div className="text-[10px] text-muted-foreground flex justify-between">
              <span>استاندارد کنکور فیزیک:</span>
              <span className="font-semibold">۷۴ ثانیه</span>
            </div>
          </div>
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
function ExamResult({ result, exam, onExit, onViewLibrary, onOpenExam }: { result: SubmitResult; exam: ExamData['exam']; onExit: () => void; onViewLibrary: (videoId?: string) => void; onOpenExam?: (id: string) => void }) {
  const { attempt, diagnosis, prescription, remedial } = result
  const pctScore = Math.max(0, Math.round((attempt.score / 20) * 100))
  const scoreColor = attempt.score >= 14 ? 'text-emerald-600 dark:text-emerald-400' : attempt.score >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'

  async function startRemedial(prescriptionId: string) {
    const res = await fetch(`/api/student/prescriptions/${prescriptionId}/remedial`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'خطا در ساخت آزمونک تسلط')
      return
    }
    if (onOpenExam) onOpenExam(data.examId)
  }

  return (
    <div className="max-w-3xl mx-auto page-enter space-y-5" role="region" aria-label="کارنامه و تحلیل آزمون">
      {/* Header Score Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground">
            <span>آزمون: {exam.title}</span>
          </div>

          <div>
            <div className={cn('text-5xl sm:text-6xl font-extrabold tracking-tight font-mono', scoreColor)}>
              {toFaNumber(attempt.score, 1)}
              <span className="text-lg font-normal text-muted-foreground mr-1.5">/ ۲۰</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground mt-1">
              درصد تراز کنکور: <strong className="text-foreground font-mono">{toFa(pctScore)}٪</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border">
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>{toFa(attempt.correctCount)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">پاسخ صحیح</div>
            </div>

            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 font-bold text-sm">
                <XCircle className="h-4 w-4" />
                <span>{toFa(attempt.wrongCount)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">پاسخ غلط</div>
            </div>

            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-sm">
                <MinusCircle className="h-4 w-4" />
                <span>{toFa(attempt.blankCount)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">نزده (بی‌پاسخ)</div>
            </div>

            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground font-bold text-sm">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(attempt.durationSec)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">مدت زمان آزمون</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remedial outcome — closes (or continues) the prescription loop */}
      {remedial && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-start gap-3.5',
            remedial.passed
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30',
          )}
        >
          {remedial.passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className={cn('font-bold text-sm', remedial.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>
              {remedial.passed ? 'ضعف درسی با موفقیت درمان شد! 🎉' : 'هنوز به حد تسلط نرسیده‌اید'}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {remedial.passed
                ? 'این مبحث در نقشه تسلط شما به رنگ سبز ثبت گردید. به سمت مبحث بعدی پیش بروید.'
                : `درصد این آزمونک ${toFa(Math.round(remedial.ratio * 100))}٪ بود (حد تسلط ${toFa(70)}٪). ویدیوی تجویزشده در اسپات‌پلیر را مجدداً مشاهده کرده و آزمونک را تکرار کنید.`}
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis */}
      <Card className="bg-card border border-border rounded-xl shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Brain className="h-4 w-4 text-primary" />
            تشخیص هوشمند — ریشه خطاهای تستی
          </CardTitle>
          <CardDescription className="text-xs">
            تحلیل میلی‌متری مباحثی که در این آزمون در آن‌ها با چالش مواجه شدید
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {diagnosis.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-foreground">هیچ ضعف تستی قابل‌توجهی شناسایی نشد. عملکرد شما عالی است!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {diagnosis.map((d) => {
                const pct = Math.round((d.wrong / d.total) * 100)
                return (
                  <div key={d.topicId} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-xs sm:text-sm text-foreground">{d.topicTitle}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {toFa(d.wrong)} غلط{d.blank > 0 ? ` و ${toFa(d.blank)} بی‌پاسخ` : ''} از {toFa(d.total)} سؤال
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-bold text-red-600 font-mono">{toFa(pct)}٪</div>
                      <div className="text-[10px] text-muted-foreground">نرخ خطا</div>
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
        <Card className="bg-card border border-border rounded-xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="h-4 w-4 text-primary" />
              نسخه تجویزی — مسیر جبران و درمان
            </CardTitle>
            <CardDescription className="text-xs">
              برای بستن هر نقطه ضعف، ویدیوی مرتبط را در اسپات‌پلیر مشاهده کرده و سپس آزمونک تسلط را شرکت کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {prescription.map((p) => (
              <div key={p.topicId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-background/50 hover:bg-secondary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs sm:text-sm text-foreground">{p.videoTitle}</div>
                    <div className="text-[11px] text-muted-foreground">{p.reason || `رفع ضعف در مبحث: ${p.topicTitle}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onViewLibrary(p.videoId)} className="h-8 px-3 text-xs gap-1.5 border-border">
                    <PlayCircle className="h-3.5 w-3.5 text-primary" /> مشاهده ویدیو
                  </Button>
                  {onOpenExam && (
                    <Button size="sm" onClick={() => startRemedial(p.prescriptionId)} className="h-8 px-3 text-xs gap-1.5 bg-primary text-primary-foreground font-bold shadow-2xs">
                      <RefreshCcw className="h-3.5 w-3.5" /> آزمونک تسلط
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-between pt-2">
        <Button onClick={onExit} variant="outline" className="gap-1.5 text-xs h-10 px-4 rounded-lg border-border">
          <ChevronRight className="h-4 w-4" /> بازگشت به فهرست آزمون‌ها
        </Button>
        <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} variant="ghost" className="text-xs text-muted-foreground">
          رفتن به بالای صفحه ↑
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

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  AlertTriangle,
  Brain,
  FileText,
  PlusCircle,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { toFa, toFaNumber, relativeTime } from '@/lib/fa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Dashboard = {
  teacher: { id: string; name: string }
  classes: { id: string; name: string; schedule: string; studentCount: number }[]
  heatmap: {
    topicId: string
    topicTitle: string
    chapterTitle: string
    correct: number
    total: number
    ratio: number
    students: number
  }[]
  summary: string
  weakestTopics: typeof heatmap
  strongTopics: typeof heatmap
  avgScore: number
  pendingApprovals: number
  recentActivity: {
    studentId: string
    studentName: string
    examTitle: string
    examType: string
    score: number
    correctCount: number
    wrongCount: number
    durationSec: number
    finishedAt: string
  }[]
  studentPerformance: {
    studentId: string
    name: string
    attempts: number
    avgScore: number
    lastActive: string | null
    isActive: boolean
  }[]
  inactiveStudents: number
  totalStudents: number
}

export function TeacherDashboard({ view, onNavigate }: { view: string; onNavigate: (v: string) => void }) {
  if (view === 'questions') return <QuestionsPanel onBack={() => onNavigate('home')} />
  if (view === 'add-question') return <AddQuestionPanel onBack={() => onNavigate('questions')} />

  return <TeacherHome onNavigate={onNavigate} />
}

function TeacherHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="border-0 hero-gradient">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">سلام {data.teacher.name.split(' ').slice(0, 2).join(' ')} 👋</h1>
              <p className="text-muted-foreground mt-2">
                <span className="font-bold text-amber-600">{toFa(data.inactiveStudents)} دانش‌آموز غیرفعال</span> در کلاس‌های شما هستند.
                میانگین نمره کلاس: <span className="font-bold text-teal-600">{toFaNumber(data.avgScore)}</span> از ۲۰.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => onNavigate('questions')} variant="outline" className="gap-2">
                  <ClipboardList className="h-4 w-4" /> بانک سؤالات
                  {data.pendingApprovals > 0 && (
                    <Badge className="ml-1 bg-amber-500">{toFa(data.pendingApprovals)}</Badge>
                  )}
                </Button>
                <Button onClick={() => onNavigate('add-question')} className="gap-2">
                  <PlusCircle className="h-4 w-4" /> افزودن سؤال
                </Button>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">تعداد کلاس‌ها</div>
              <div className="text-4xl font-bold text-teal-600">{toFa(data.classes.length)}</div>
              <div className="text-xs text-muted-foreground">{toFa(data.totalStudents)} دانش‌آموز</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="کل دانش‌آموزان" value={toFa(data.totalStudents)} icon={<Users className="h-4 w-4" />} accent="teal" />
        <StatCard title="میانگین نمره کلاس" value={toFaNumber(data.avgScore)} sub="از ۲۰" icon={<Brain className="h-4 w-4" />} accent="emerald" />
        <StatCard title="دانش‌آموزان غیرفعال" value={toFa(data.inactiveStudents)} sub="بدون فعالیت ۱۴ روز" icon={<AlertTriangle className="h-4 w-4" />} accent="red" />
        <StatCard title="سؤالات در انتظار تأیید" value={toFa(data.pendingApprovals)} icon={<FileText className="h-4 w-4" />} accent="amber" />
      </div>

      {/* Persian analytical summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            خلاصه تحلیلی کلاس پیش از جلسه بعد
          </CardTitle>
          <CardDescription>بر اساس داده آزمون‌ها — آماده‌شده برای دبیر</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/40 p-4 rounded-lg">{data.summary}</pre>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal-600" />
            نقشه حرارتی ضعف کلاس
          </CardTitle>
          <CardDescription>مباحثی که کلاس در آن‌ها مشکل دارد — برای مرور در جلسه بعد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.heatmap.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">داده‌ای موجود نیست.</div>
            ) : (
              data.heatmap.map((h) => (
                <div
                  key={h.topicId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    h.ratio < 0.5 && h.total >= 3 ? 'border-red-500/30 bg-red-500/5'
                    : h.ratio >= 0.75 ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-transparent bg-muted/30',
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{h.topicTitle}</div>
                    <div className="text-xs text-muted-foreground">{h.chapterTitle} · {toFa(h.students)} دانش‌آموز · {toFa(h.total)} پاسخ</div>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full', h.ratio < 0.5 ? 'bg-red-500' : h.ratio >= 0.75 ? 'bg-emerald-500' : 'bg-amber-500')}
                        style={{ width: `${h.ratio * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center">{toFaNumber(h.ratio * 100)}٪ صحت</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity + Student performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">فعالیت‌های اخیر کلاس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">فعالیتی ثبت نشده.</div>
              ) : (
                data.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.studentName}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.examTitle}</div>
                    </div>
                    <span className={`font-bold ${a.score >= 14 ? 'text-emerald-600' : a.score >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {toFaNumber(a.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">عملکرد دانش‌آموزان</CardTitle>
            <CardDescription>هشدار زودهنگام برای دانش‌آموزان غیرفعال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.studentPerformance.map((s) => (
                <div key={s.studentId} className={cn('flex items-center gap-2 p-2 rounded border text-sm', !s.isActive && 'border-amber-500/40 bg-amber-500/5')}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {toFa(s.attempts)} آزمون · آخرین: {s.lastActive ? relativeTime(new Date(s.lastActive)) : '—'}
                    </div>
                  </div>
                  <div className="text-left">
                    {s.attempts > 0 ? (
                      <span className={`font-bold ${s.avgScore >= 14 ? 'text-emerald-600' : s.avgScore >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                        {toFaNumber(s.avgScore)}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-amber-700">غیرفعال</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============ Questions bank panel ============
function QuestionsPanel({ onBack }: { onBack: () => void }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  useEffect(() => {
    fetch(`/api/teacher/questions?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .finally(() => setLoading(false))
  }, [filter])

  async function approve(id: string, approved: boolean) {
    await fetch(`/api/teacher/questions/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success(approved ? 'سؤال تأیید شد' : 'سؤال رد شد')
  }

  async function remove(id: string) {
    if (!confirm('این سؤال حذف شود؟')) return
    await fetch(`/api/teacher/questions/${id}`, { method: 'DELETE' })
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success('حذف شد')
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بانک سؤالات</h1>
          <p className="text-muted-foreground text-sm mt-1">سؤالاتی که ساخته‌اید — افزودن فقط با تأیید خودتان</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['ALL', 'همه'],
          ['PENDING', 'در انتظار'],
          ['APPROVED', 'تأییدشده'],
          ['REJECTED', 'ردشده'],
        ] as const).map(([k, l]) => (
          <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : questions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">سؤالی یافت نشد.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{q.chapter.title}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{q.topic.title}</Badge>
                      <Badge variant="outline" className="text-[10px]">{difficultyLabel(q.difficulty)}</Badge>
                      {q.approvalStatus === 'PENDING' && <Badge variant="outline" className="text-[10px] bg-amber-500/10">در انتظار</Badge>}
                      {q.approvalStatus === 'APPROVED' && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700">تأییدشده</Badge>}
                      {q.approvalStatus === 'REJECTED' && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700">ردشده</Badge>}
                    </div>
                    <div className="text-sm font-medium leading-relaxed">{q.stem}</div>
                    <div className="grid grid-cols-2 gap-1 mt-3 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((o) => (
                        <div key={o} className={cn('flex gap-1', q.correctOption === o && 'text-emerald-600 font-bold')}>
                          <span>{toFa(o)}.</span><span>{q[`option${o}`]}</span>
                          {q.correctOption === o && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  {q.approvalStatus !== 'APPROVED' && (
                    <Button size="sm" variant="outline" onClick={() => approve(q.id, true)} className="gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> تأیید
                    </Button>
                  )}
                  {q.approvalStatus !== 'REJECTED' && (
                    <Button size="sm" variant="outline" onClick={() => approve(q.id, false)} className="gap-1 text-red-700">
                      <XCircle className="h-3 w-3" /> رد
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(q.id)} className="gap-1 text-muted-foreground mr-auto">
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function difficultyLabel(d: string) {
  switch (d) { case 'EASY': return 'آسان'; case 'MEDIUM': return 'متوسط'; case 'HARD': return 'سخت'; default: return d }
}

// ============ Add question panel ============
function AddQuestionPanel({ onBack }: { onBack: () => void }) {
  const [chapters, setChapters] = useState<any[]>([])
  const [chapterId, setChapterId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [stem, setStem] = useState('')
  const [opts, setOpts] = useState({ A: '', B: '', C: '', D: '' })
  const [correct, setCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/chapters').then((r) => r.json()).then((d) => setChapters(d.chapters || []))
  }, [])

  const currentChapter = chapters.find((c) => c.id === chapterId)

  async function submit() {
    if (!chapterId || !topicId || !stem || !opts.A || !opts.B || !opts.C || !opts.D) {
      toast.error('همه فیلدها را تکمیل کنید.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId, topicId, stem,
          optionA: opts.A, optionB: opts.B, optionC: opts.C, optionD: opts.D,
          correctOption: correct, difficulty,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'خطا')
        return
      }
      toast.success('سؤال با موفقیت افزوده شد')
      onBack()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 page-enter max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-teal-600" />
            افزودن سؤال جدید
          </h1>
          <p className="text-muted-foreground text-sm mt-1">اضافه کردن سؤال فقط با دو حرکت: کپی متن + بارگذاری عکس شکل</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>فصل</Label>
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger><SelectValue placeholder="انتخاب فصل" /></SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>مبحث</Label>
              <Select value={topicId} onValueChange={setTopicId} disabled={!chapterId}>
                <SelectTrigger><SelectValue placeholder="انتخاب مبحث" /></SelectTrigger>
                <SelectContent>
                  {currentChapter?.topics.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>متن سؤال</Label>
            <Textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={4} placeholder="متن سؤال را اینجا بنویسید…" />
          </div>
          <div className="space-y-1.5">
            <Label>گزینه‌ها</Label>
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={correct === o ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCorrect(o)}
                    className="w-10 h-10 p-0"
                  >
                    {toFa(o)}
                  </Button>
                  <Input
                    value={opts[o]}
                    onChange={(e) => setOpts({ ...opts, [o]: e.target.value })}
                    placeholder={`گزینه ${toFa(o)}`}
                    className={cn(correct === o && 'border-emerald-500')}
                  />
                  {correct === o && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">گزینه سبز = پاسخ صحیح</div>
          </div>
          <div className="space-y-1.5">
            <Label>سختی</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">آسان</SelectItem>
                <SelectItem value="MEDIUM">متوسط</SelectItem>
                <SelectItem value="HARD">سخت</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            💡 در نسخه نهایی، بارگذاری عکس شکل سؤال هم در همین فرم قرار خواهد گرفت.
            متن + عکس، بدون نیاز به هیچ مهارت کامپیوتری.
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full gap-2">
            <PlusCircle className="h-4 w-4" /> ثبت سؤال
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

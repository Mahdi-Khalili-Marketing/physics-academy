'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import {
  BookOpen,
  Brain,
  TrendingUp,
  Zap,
  Target,
  AlertTriangle,
  BookMarked,
  Sparkles,
  ChevronLeft,
  RefreshCcw,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { MasteryDot } from '@/components/shared/MasteryDot'
import { PrescriptionPanel } from '@/components/student/PrescriptionPanel'
import { toFa, toFaNumber, relativeTime, formatDuration } from '@/lib/fa'
import { toast } from 'sonner'

type Dashboard = {
  user: { id: string; name: string; avatarColor: string }
  stats: {
    totalAttempts: number
    avgScore: number
    masteryGreen: number
    masteryYellow: number
    masteryRed: number
    masteryNone: number
    errorsUnresolved: number
    leitnerDue: number
    leitnerTotal: number
  }
  mastery: {
    chapterId: string
    title: string
    slug: string
    order: number
    avgScore: number | null
    level: 'green' | 'yellow' | 'red' | 'none'
    attemptsCount: number
  }[]
  speedAccuracy: { attemptId: string; examTitle: string; examType: string; score: number; avgTimePerQ: number }[]
  progress: { index: number; score: number; date: string; title: string }[]
  wrongOptionCounts: { A: number; B: number; C: number; D: number }
  recentAttempts: {
    id: string
    examTitle: string
    examType: string
    chapterTitle: string | null
    score: number
    correctCount: number
    wrongCount: number
    blankCount: number
    durationSec: number
    finishedAt: string
  }[]
  notifications: { id: string; title: string; body: string; type: string; createdAt: string }[]
}

export function StudentDashboard({ onOpenExam, onOpenLibrary, onOpenVideo }: { onOpenExam: (id?: string) => void; onOpenLibrary: () => void; onOpenVideo: (videoId: string) => void }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const wrongOptionTotal = Object.values(data.wrongOptionCounts).reduce((s, v) => s + v, 0)
  const wrongOptionData = (['A', 'B', 'C', 'D'] as const).map((k) => ({
    option: `گزینه ${toFa(k)}`,
    count: data.wrongOptionCounts[k],
    pct: wrongOptionTotal > 0 ? Math.round((data.wrongOptionCounts[k] / wrongOptionTotal) * 100) : 0,
  }))

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="border-0 hero-gradient overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                سلام {data.user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                امروز <span className="font-bold text-primary">{toFa(data.stats.leitnerDue)} کارت لایتنر</span> برای مرور داری
                و <span className="font-bold text-amber-600 dark:text-amber-400">{toFa(data.stats.errorsUnresolved)} اشتباه</span> ثبت‌نشده در دفتر اشتباهات.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => onOpenExam()} className="gap-2">
                  <Target className="h-4 w-4" /> شروع آزمون جدید
                </Button>
                <Button onClick={onOpenLibrary} variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" /> کتابخانه ویدیوها
                </Button>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">میانگین نمره</div>
              <div className="text-4xl font-bold text-primary stat-num">{toFaNumber(data.stats.avgScore)}</div>
              <div className="text-xs text-muted-foreground">از ۲۰ · {toFa(data.stats.totalAttempts)} آزمون</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription loop — the "doctor" view */}
      <PrescriptionPanel onOpenVideo={onOpenVideo} onOpenExam={(id) => onOpenExam(id)} />

      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="فصل‌های تسلط‌یافته"
          value={toFa(data.stats.masteryGreen)}
          sub={`از ${toFa(data.stats.masteryGreen + data.stats.masteryYellow + data.stats.masteryRed + data.stats.masteryNone)} فصل`}
          icon={<Brain className="h-4 w-4" />}
          accent="emerald"
        />
        <StatCard
          title="فصل‌های نیازمند تمرین"
          value={toFa(data.stats.masteryYellow + data.stats.masteryRed)}
          sub={`زرد: ${toFa(data.stats.masteryYellow)} · قرمز: ${toFa(data.stats.masteryRed)}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="amber"
        />
        <StatCard
          title="دفتر اشتباهات"
          value={toFa(data.stats.errorsUnresolved)}
          sub="اشتباه ثبت‌نشده — مرور کنید"
          icon={<BookMarked className="h-4 w-4" />}
          accent="red"
        />
        <StatCard
          title="کارت‌های لایتنر"
          value={`${toFa(data.stats.leitnerDue)} / ${toFa(data.stats.leitnerTotal)}`}
          sub="امروز باید مرور شوند"
          icon={<Sparkles className="h-4 w-4" />}
          accent="purple"
        />
      </div>

      {/* Mastery map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              نقشه تسلط فصل‌به‌فصل
            </CardTitle>
            <CardDescription>وضعیت هر فصل با یک نگاه</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <MasteryDot level="green" label="تسلط" />
            <MasteryDot level="yellow" label="نیازمند تمرین" />
            <MasteryDot level="red" label="ضعف" pulse />
            <MasteryDot level="none" label="بدون داده" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.mastery.map((m) => (
              <button
                key={m.chapterId}
                className={`text-right rounded-lg border p-3 hover-lift cursor-pointer press-scale ${
                  m.level === 'green' ? 'border-emerald-500/40 bg-emerald-500/5'
                  : m.level === 'yellow' ? 'border-amber-500/40 bg-amber-500/5'
                  : m.level === 'red' ? 'border-red-500/40 bg-red-500/5 cell-red'
                  : 'border-dashed'
                }`}
                onClick={() => onOpenLibrary()}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">فصل {toFa(m.order)}</div>
                    <div className="font-medium mt-1">{m.title}</div>
                  </div>
                  <MasteryDot level={m.level} size="lg" />
                </div>
                {m.avgScore !== null && (
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>میانگین: <span className="font-bold text-foreground stat-num">{toFaNumber(m.avgScore)}</span></span>
                    <span>{toFa(m.attemptsCount)} آزمون</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Progress over time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              روند پیشرفت در طول زمان
            </CardTitle>
            <CardDescription>نمره آزمون‌های اخیر (از ۲۰)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.progress.length === 0 ? (
              <EmptyState text="هنوز آزمونی ن داده‌اید." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.progress} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                  <XAxis dataKey="index" tickFormatter={(v) => toFa(v)} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tickFormatter={(v) => toFa(v)} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'var(--font-fa)', borderRadius: 8 }}
                    formatter={(v: number) => [toFaNumber(v), 'نمره']}
                    labelFormatter={(l) => `آزمون ${toFa(Number(l))}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="oklch(0.6 0.18 200)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'oklch(0.6 0.18 200)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Speed vs Accuracy scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              نمودار سرعت در برابر دقت
            </CardTitle>
            <CardDescription>هر نقطه یک آزمون است — هدف: پایین‌راست (سریع و دقیق)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.speedAccuracy.length === 0 ? (
              <EmptyState text="داده‌ای موجود نیست." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                  <XAxis
                    type="number"
                    dataKey="avgTimePerQ"
                    name="زمان"
                    unit=" ث"
                    tickFormatter={(v) => toFa(v)}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'میانگین زمان هر سؤال (ثانیه)', position: 'insideBottom', offset: -5, style: { fontSize: 10 } }}
                  />
                  <YAxis
                    type="number"
                    dataKey="score"
                    name="نمره"
                    domain={[0, 20]}
                    tickFormatter={(v) => toFa(v)}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ fontFamily: 'var(--font-fa)', borderRadius: 8 }}
                    formatter={(v: number, n: string) => (n === 'نمره' ? toFaNumber(v) : `${toFa(v)} ث`)}
                  />
                  <ReferenceArea x1={0} x2={45} y1={14} y2={20} fill="oklch(0.7 0.18 145 / 0.1)" />
                  <Scatter data={data.speedAccuracy} fill="oklch(0.6 0.18 200)" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wrong option pattern + Recent attempts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              تحلیل گزینه‌های غلط
            </CardTitle>
            <CardDescription>کدام گزینه را بیشتر اشتباه می‌زنید؟</CardDescription>
          </CardHeader>
          <CardContent>
            {wrongOptionTotal === 0 ? (
              <EmptyState text="هنوز اشتباهی ثبت نشده." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={wrongOptionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                  <XAxis dataKey="option" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => toFa(v)} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'var(--font-fa)', borderRadius: 8 }}
                    formatter={(v: number) => [toFa(v), 'تعداد']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {wrongOptionData.map((_, i) => (
                      <Cell key={i} fill={`oklch(0.65 0.18 ${(30 + i * 70).toString()})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                آزمون‌های اخیر
              </CardTitle>
              <CardDescription>آخرین فعالیت‌های شما</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenExam()} className="gap-1">
              همه آزمون‌ها <ChevronLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentAttempts.length === 0 ? (
              <EmptyState text="هنوز آزمونی نداده‌اید." action={<Button onClick={() => onOpenExam()} className="gap-2"><RefreshCcw className="h-4 w-4" /> شروع کنید</Button>} />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.recentAttempts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenExam()}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.examTitle}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{examTypeLabel(a.examType)}</Badge>
                        <span>{relativeTime(new Date(a.finishedAt))}</span>
                        <span>· {formatDuration(a.durationSec)}</span>
                      </div>
                    </div>
                    <div className="text-left mr-3">
                      <div className={`font-bold ${a.score >= 14 ? 'text-emerald-600' : a.score >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                        {toFaNumber(a.score)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ✓ {toFa(a.correctCount)} · ✗ {toFa(a.wrongCount)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>اعلان‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                </div>
                <span className="text-xs text-muted-foreground">{relativeTime(new Date(n.createdAt))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-3">
      <RefreshCcw className="h-8 w-8 opacity-30" />
      <p className="text-sm">{text}</p>
      {action}
    </div>
  )
}

export function examTypeLabel(t: string): string {
  switch (t) {
    case 'TOPIC_QUIZ': return 'آزمونک موضوعی'
    case 'CHAPTER_EXAM': return 'آزمون جامع فصل'
    case 'KONKUR_SIM': return 'شبیه‌ساز کنکور'
    case 'REMEDIAL': return 'آزمون مجدد'
    default: return t
  }
}

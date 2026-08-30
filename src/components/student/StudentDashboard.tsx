'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
  Flame,
  CheckCircle2,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { MasteryDot } from '@/components/shared/MasteryDot'
import { PrescriptionPanel } from '@/components/student/PrescriptionPanel'
import { toFa, toFaNumber, relativeTime, formatDuration } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { TEN_DAY_CAMP } from '@/lib/curriculum-10days'

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

export function StudentDashboard({
  onOpenExam,
  onOpenLibrary,
  onOpenVideo,
}: {
  onOpenExam: (id?: string) => void
  onOpenLibrary: () => void
  onOpenVideo: (videoId: string) => void
}) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data || !data.stats || !data.user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  const wrongOptionTotal = data.wrongOptionCounts
    ? Object.values(data.wrongOptionCounts).reduce((s, v) => s + v, 0)
    : 0

  const wrongOptionData = (['A', 'B', 'C', 'D'] as const).map((k) => ({
    key: k,
    option: `گزینه ${k === 'A' ? '۱' : k === 'B' ? '۲' : k === 'C' ? '۳' : '۴'}`,
    count: data.wrongOptionCounts?.[k] ?? 0,
    pct: wrongOptionTotal > 0 ? Math.round(((data.wrongOptionCounts?.[k] ?? 0) / wrongOptionTotal) * 100) : 0,
  }))

  const [activeCampDay, setActiveCampDay] = useState(4)
  const currentDayPlan = TEN_DAY_CAMP.find((c) => c.day === activeCampDay) || TEN_DAY_CAMP[3]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="glass-card shadow-md border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <CardContent className="p-6 lg:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-primary font-semibold shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>دوره آمادگی فیزیک کنکور</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>استمرار مطالعه: ۴ روز پیاپی 🔥</span>
                </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                سلام {data.user.name.split(' ')[0]} عزیز 👋
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                امروز <span className="font-bold text-primary">{toFa(data.stats.leitnerDue)} کارت لایتنر</span> برای مرور آماده است
                و <span className="font-bold text-amber-600 dark:text-amber-400">{toFa(data.stats.errorsUnresolved)} اشتباه</span> در انتظار بررسی در دفترچه اشتباهات داری.
              </p>
              <div className="pt-2 flex flex-wrap gap-2.5">
                <Button onClick={() => onOpenExam()} className="gap-2 shadow-xs h-10 px-4">
                  <Target className="h-4 w-4" /> شروع آزمون جدید
                </Button>
                <Button onClick={onOpenLibrary} variant="outline" className="gap-2 h-10 px-4">
                  <BookOpen className="h-4 w-4" /> کتابخانه ویدیوها
                </Button>
              </div>
            </div>

            {/* Score & Progress Badge */}
            <div className="bg-background/80 backdrop-blur rounded-2xl border p-4 text-center min-w-[160px] shadow-xs self-stretch sm:self-auto space-y-1">
              <div className="text-xs text-muted-foreground font-medium">میانگین نمره کنکور</div>
              <div className="text-4xl font-black text-primary stat-num">{toFaNumber(data.stats.avgScore, 1)}</div>
              <div className="text-[11px] text-muted-foreground">از ۲۰ · {toFa(data.stats.totalAttempts)} آزمونک ثبت‌شده</div>
              <div className="pt-1.5 text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>رشد +۱.۸ نمره در ماه اخیر</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 10-Day Intensive Camp Interactive Tracker */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5">
                🚀 اردوی ۱۰ روزه کنکور
              </Badge>
              <span className="font-bold text-sm">
                روز انتخاب‌شده: روز {toFa(activeCampDay)} از ۱۰ ({currentDayPlan.title})
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              پیشرفت کل اردو: <strong className="text-foreground">۴۰٪</strong> ({toFa(4)} روز از {toFa(10)} روز)
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: '40%' }} />
          </div>

          {/* 10 Days Pills - Clickable */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
            {TEN_DAY_CAMP.map((c) => {
              const isSelected = c.day === activeCampDay
              const isPassed = c.day < 4
              const isCurrent = c.day === 4
              return (
                <button
                  key={c.day}
                  type="button"
                  onClick={() => setActiveCampDay(c.day)}
                  className={cn(
                    'text-center p-2 rounded-xl border text-[11px] transition-all cursor-pointer press-scale',
                    isSelected && 'ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-black shadow-md border-primary',
                    !isSelected && isPassed && 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/25',
                    !isSelected && isCurrent && 'bg-primary/20 border-primary/40 text-primary font-bold hover:bg-primary/30',
                    !isSelected && !isPassed && !isCurrent && 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/70',
                  )}
                >
                  <div className="font-bold">روز {toFa(c.day)}</div>
                  <div className="text-[9px] opacity-80 mt-0.5">{c.grade}</div>
                </button>
              )
            })}
          </div>

          {/* Selected Day Action Box */}
          <div className="mt-2 p-3.5 rounded-xl bg-background/80 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  پایه {currentDayPlan.grade}
                </Badge>
                <strong className="text-foreground">{currentDayPlan.title}</strong>
              </div>
              <div className="text-muted-foreground text-[11px] flex flex-wrap gap-x-3 gap-y-1">
                {currentDayPlan.topics.map((t, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenLibrary}
                className="h-8 text-xs gap-1 border-primary/30"
              >
                <BookOpen className="h-3.5 w-3.5" />
                ویدیو ({currentDayPlan.videoDurationMin} دقیقه)
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenExam()}
                className="h-8 text-xs gap-1 shadow-xs"
              >
                <Target className="h-3.5 w-3.5" />
                شروع آزمونک روز {toFa(activeCampDay)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription loop — the "doctor" view */}
      <PrescriptionPanel onOpenVideo={onOpenVideo} onOpenExam={(id) => onOpenExam(id)} />

      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="فصل‌های با تسلط سبز"
          value={toFa(data.stats.masteryGreen)}
          sub={`از ${toFa((data.stats.masteryGreen || 0) + (data.stats.masteryYellow || 0) + (data.stats.masteryRed || 0) + (data.stats.masteryNone || 0))} فصل دوره`}
          icon={<Brain className="h-4 w-4" />}
          accent="emerald"
        />
        <StatCard
          title="فصل‌های نیازمند تمرین"
          value={toFa((data.stats.masteryYellow || 0) + (data.stats.masteryRed || 0))}
          sub={`زرد: ${toFa(data.stats.masteryYellow)} · قرمز: ${toFa(data.stats.masteryRed)}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="amber"
        />
        <StatCard
          title="دفترچه اشتباهات"
          value={toFa(data.stats.errorsUnresolved)}
          sub="اشتباه بدون مرور شب آزمون"
          icon={<BookMarked className="h-4 w-4" />}
          accent="red"
        />
        <StatCard
          title="کارت‌های لایتنر فرمول"
          value={`${toFa(data.stats.leitnerDue)} / ${toFa(data.stats.leitnerTotal)}`}
          sub="برای مرور امروز آماده‌اند"
          icon={<Sparkles className="h-4 w-4" />}
          accent="purple"
        />
      </div>

      {/* Mastery map */}
      <Card className="glass-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              نقشه تسلط فصل‌به‌فصل فیزیک
            </CardTitle>
            <CardDescription className="text-xs">وضعیت یادگیری در هر فصل؛ برای مشاهده ویدیوها کلیک کنید</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <MasteryDot level="green" label="تسلط عالی" />
            <MasteryDot level="yellow" label="متوسط" />
            <MasteryDot level="red" label="نیاز به تقویت" pulse />
            <MasteryDot level="none" label="بدون آزمون" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data.mastery || []).map((m) => {
              const score = m.avgScore ?? 0
              const progressPct = (score / 20) * 100
              return (
                <button
                  key={m.chapterId}
                  className={`text-right rounded-xl border p-3.5 card-interactive cursor-pointer ${
                    m.level === 'green'
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : m.level === 'yellow'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : m.level === 'red'
                      ? 'border-red-500/40 bg-red-500/5 cell-red'
                      : 'border-dashed bg-muted/20'
                  }`}
                  onClick={() => onOpenLibrary()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-[11px] text-muted-foreground font-semibold">فصل {toFa(m.order)}</div>
                      <div className="font-bold text-sm text-foreground mt-0.5">{m.title}</div>
                    </div>
                    <MasteryDot level={m.level} size="lg" />
                  </div>
                  {m.avgScore !== null ? (
                    <div className="mt-3 space-y-1.5">
                      <Progress
                        value={progressPct}
                        className={cn(
                          'h-1.5',
                          m.level === 'green' && '[&>div]:bg-emerald-500',
                          m.level === 'yellow' && '[&>div]:bg-amber-500',
                          m.level === 'red' && '[&>div]:bg-red-500',
                        )}
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          میانگین: <span className="font-bold text-foreground stat-num">{toFaNumber(m.avgScore, 1)} / ۲۰</span>
                        </span>
                        <span>{toFa(m.attemptsCount)} آزمون</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-muted-foreground">هنوز در آزمون این فصل شرکت نکرده‌اید</div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Progress over time */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              روند پیشرفت نمرات در طول زمان
            </CardTitle>
            <CardDescription className="text-xs">نمره آزمون‌های اخیر از مقیاس ۲۰</CardDescription>
          </CardHeader>
          <CardContent>
            {(!data.progress || data.progress.length === 0) ? (
              <EmptyState text="هنوز آزمونی نداده‌اید." />
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-end gap-3 h-44 border-b border-border/60 pb-2 px-2">
                  {data.progress.map((p, idx) => {
                    const heightPct = Math.max(8, Math.min(100, (p.score / 20) * 100))
                    const isGood = p.score >= 12
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          {toFaNumber(p.score, 1)}
                        </div>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={cn(
                            'w-full max-w-[32px] rounded-t-lg transition-all',
                            isGood ? 'bg-primary/80 group-hover:bg-primary' : 'bg-amber-500/80 group-hover:bg-amber-500'
                          )}
                        />
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap truncate max-w-[50px]">
                          آزمون {toFa(p.index)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>اولین آزمون: {toFaNumber(data.progress[0]?.score ?? 0, 1)}</span>
                  <span className="font-bold text-emerald-600">
                    آخرین نمره: {toFaNumber(data.progress[data.progress.length - 1]?.score ?? 0, 1)} از ۲۰
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speed vs Accuracy Analysis */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              ماتریس سرعت در برابر دقت
            </CardTitle>
            <CardDescription className="text-xs">
              میانگین زمان هر تست (ثانیه) در مقایسه با نمره — استاندارد کنکور: ۷۴ ثانیه
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!data.speedAccuracy || data.speedAccuracy.length === 0) ? (
              <EmptyState text="داده‌ای موجود نیست." />
            ) : (
              <div className="space-y-2.5">
                {data.speedAccuracy.map((item, idx) => {
                  const isFast = item.avgTimePerQ <= 74
                  const isHigh = item.score >= 12
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-2">
                        <div className="font-medium text-xs truncate">{item.examTitle}</div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>میانگین زمان: <strong className="text-foreground">{toFa(item.avgTimePerQ)} ثانیه</strong></span>
                          <span>·</span>
                          <span className={cn(isFast ? 'text-emerald-600' : 'text-amber-600')}>
                            {isFast ? '⚡ سرعت عالی' : '🐢 نیاز به افزایش سرعت'}
                          </span>
                        </div>
                      </div>
                      <div className="text-left pl-2">
                        <div className={cn('text-sm font-black', isHigh ? 'text-emerald-600' : 'text-amber-600')}>
                          {toFaNumber(item.score, 1)} <span className="text-[10px] text-muted-foreground font-normal">/ ۲۰</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wrong Option Breakdown + Recent Attempts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Wrong Option Pattern */}
        <Card className="lg:col-span-1 glass-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              تحلیل تله‌های تستی
            </CardTitle>
            <CardDescription className="text-xs">توزیع گزینه‌هایی که اشتباه انتخاب کرده‌اید</CardDescription>
          </CardHeader>
          <CardContent>
            {wrongOptionTotal === 0 ? (
              <EmptyState text="هنوز تستی به غلط پاسخ داده نشده است." />
            ) : (
              <div className="space-y-3 pt-1">
                {wrongOptionData.map((opt) => (
                  <div key={opt.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{opt.option}</span>
                      <span className="text-muted-foreground">{toFa(opt.count)} بار ({toFa(opt.pct)}٪)</span>
                    </div>
                    <Progress value={opt.pct} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                آزمون‌های اخیر
              </CardTitle>
              <CardDescription className="text-xs">آخرین تلاش‌ها و ارزیابی‌های ثبت‌شده</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenExam()} className="gap-1 text-xs">
              همه آزمون‌ها <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {(!data.recentAttempts || data.recentAttempts.length === 0) ? (
              <EmptyState
                text="هنوز در آزمونی شرکت نکرده‌اید."
                action={
                  <Button onClick={() => onOpenExam()} className="gap-2 text-xs">
                    <RefreshCcw className="h-3.5 w-3.5" /> شروع اولین آزمونک
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {data.recentAttempts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenExam()}
                    className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 text-right transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{a.examTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {examTypeLabel(a.examType)}
                        </Badge>
                        <span>{relativeTime(a.finishedAt)}</span>
                        <span>· {formatDuration(a.durationSec)}</span>
                      </div>
                    </div>
                    <div className="text-left mr-3">
                      <div
                        className={cn(
                          'font-bold text-sm',
                          a.score >= 14 ? 'text-emerald-600' : a.score >= 10 ? 'text-amber-600' : 'text-red-600',
                        )}
                      >
                        {toFaNumber(a.score, 1)}
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
      {data.notifications && data.notifications.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">اعلان‌های آموزشگاه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <div className="flex-1">
                  <div className="font-medium text-xs">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
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
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
      <RefreshCcw className="h-6 w-6 opacity-30" />
      <p className="text-xs">{text}</p>
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

'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlayCircle,
  BookOpen,
  TrendingUp,
  Sparkles,
  Share2,
  Printer,
  ShieldCheck,
  Award,
  BookMarked,
  Layers,
  ArrowUpRight,
  PhoneCall,
} from 'lucide-react'
import { toFa, toFaNumber, faDate, formatDuration } from '@/lib/fa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ReportData = {
  student: {
    id: string
    name: string
    phone: string
    grade: string
    avatarColor: string
    joinDate: string
  }
  summary: {
    totalAttempts: number
    avgScore: number
    totalWatchSec: number
    completedVideos: number
    activeWeaknesses: number
    recoveredWeaknesses: number
    unresolvedErrors: number
    leitnerTotal: number
    greenChaptersCount: number
    yellowChaptersCount: number
    redChaptersCount: number
  }
  chapterMastery: {
    id: string
    title: string
    slug: string
    order: number
    avgScore: number | null
    level: 'green' | 'yellow' | 'red' | 'none'
    attemptsCount: number
    topicsCount: number
  }[]
  prescriptions: {
    id: string
    topicTitle: string
    chapterTitle: string
    videoTitle: string | null
    reason: string
    status: 'PENDING' | 'WATCHED' | 'RECOVERED'
    createdAt: string
    recoveredAt: string | null
  }[]
  recentAttempts: {
    id: string
    examTitle: string
    examType: string
    chapterTitle: string | null
    score: number
    correctCount: number
    wrongCount: number
    blankCount: number
    finishedAt: string | null
  }[]
  parentAdvice: string
  generatedAt: string
}

export default function ParentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/public/report/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('کارنامه مورد نظر یافت نشد.')
        return res.json()
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message || 'خطا در بارگذاری کارنامه'))
      .finally(() => setLoading(false))
  }, [id])

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: `گزارش پیشرفت فیزیک ${data?.student.name || ''}`,
          text: `کارنامه تحلیلی و وضعیت تسلط بر فیزیک کنکور`,
          url: window.location.href,
        })
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('لینک کارنامه در حافظه کپی شد.')
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">گزارش در دسترس نیست</h2>
          <p className="text-sm text-muted-foreground">{error || 'اطلاعاتی برای این دانش‌آموز یافت نشد.'}</p>
        </Card>
      </div>
    )
  }

  const { student, summary, chapterMastery, prescriptions, recentAttempts, parentAdvice } = data
  const scoreLevelColor =
    summary.avgScore >= 15
      ? 'text-emerald-600 dark:text-emerald-400'
      : summary.avgScore >= 10
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-foreground print:bg-white print:p-0">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur print:hidden px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">آکادمی تخصصی فیزیک کنکور</div>
              <div className="text-[11px] text-muted-foreground">سامانه گزارش هوشمند والدین</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">اشتراک‌گذاری</span>
            </Button>
            <Button size="sm" variant="default" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              <span>چاپ / PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Student Profile Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 via-primary/5 to-background border-r-4 border-r-primary">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0"
                  style={{ backgroundColor: student.avatarColor || '#0ea5a4' }}
                >
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">{student.name}</h1>
                    <Badge variant="secondary" className="text-xs bg-primary/15 text-primary border-0">
                      {student.grade}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    تاریخ صدور گزارش: {faDate(new Date(data.generatedAt))} · وضعیت تحصیلی: فعال در دوره کنکور
                  </p>
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="bg-background/80 backdrop-blur rounded-xl border p-3 text-center min-w-[130px] self-stretch sm:self-auto">
                <div className="text-[11px] text-muted-foreground">میانگین نمره فیزیک</div>
                <div className={cn('text-3xl font-extrabold mt-0.5', scoreLevelColor)}>
                  {toFaNumber(summary.avgScore, 1)}
                  <span className="text-xs text-muted-foreground font-normal mr-1">از ۲۰</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{toFa(summary.totalAttempts)}</div>
                <div className="text-xs text-muted-foreground">آزمونک انجام‌شده</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{toFa(summary.recoveredWeaknesses)}</div>
                <div className="text-xs text-muted-foreground">ضعف جبران‌شده</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{toFa(summary.completedVideos)}</div>
                <div className="text-xs text-muted-foreground">درس‌نامه کامل‌شده</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{toFa(summary.unresolvedErrors)}</div>
                <div className="text-xs text-muted-foreground">اشتباه در انتظار مرور</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actionable Advice For Parents */}
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground">توصیه تحلیلی به اولیاء گرامی</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{parentAdvice}</p>
            </div>
          </CardContent>
        </Card>

        {/* Chapter Mastery Status */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  نقشه تسلط بر فصول فیزیک
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  ارزیابی سطح یادگیری در هر فصل بر اساس آزمون‌های استاندارد کنکوری
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> تسلط عالی
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> نیاز به تمرین
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> توجه فوری
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {chapterMastery.map((ch) => {
              const score = ch.avgScore ?? 0
              const progressPct = (score / 20) * 100
              const badgeConfig =
                ch.level === 'green'
                  ? { label: 'تسلط عالی', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' }
                  : ch.level === 'yellow'
                  ? { label: 'متوسط', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' }
                  : ch.level === 'red'
                  ? { label: 'نیاز به تقویت', bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' }
                  : { label: 'بدون آزمون', bg: 'bg-muted text-muted-foreground border-transparent' }

              return (
                <div key={ch.id} className="rounded-xl border p-3.5 space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">{ch.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[11px]', badgeConfig.bg)}>
                        {badgeConfig.label}
                      </Badge>
                      <span className="text-sm font-bold min-w-[50px] text-left font-mono">
                        {ch.avgScore !== null ? `${toFaNumber(ch.avgScore, 1)} / ۲۰` : '—'}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={progressPct}
                    className={cn(
                      'h-2',
                      ch.level === 'green' && '[&>div]:bg-emerald-500',
                      ch.level === 'yellow' && '[&>div]:bg-amber-500',
                      ch.level === 'red' && '[&>div]:bg-red-500',
                    )}
                  />
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>{toFa(ch.topicsCount)} زیرمبحث درسی</span>
                    <span>{toFa(ch.attemptsCount)} آزمون ثبت‌شده</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Diagnosis & Prescription Loop */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              چرخه هوشمند تشخیص و جبران ضعف‌ها
            </CardTitle>
            <CardDescription className="text-xs">
              سیستم به جای رها کردن اشتباهات، برای هر ضعف ویدیوی کوتاه تجویز کرده و با آزمونک جبرانی آن را درمان می‌کند.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                هیچ نقطه ضعف حادی ثبت نشده است. تمام مباحث در وضعیت مطلوب هستند.
              </div>
            ) : (
              prescriptions.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    p.status === 'RECOVERED'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-amber-500/30 bg-amber-500/5',
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{p.topicTitle}</span>
                      <span className="text-xs text-muted-foreground">({p.chapterTitle})</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.reason}</p>
                    {p.videoTitle && (
                      <div className="flex items-center gap-1 text-xs text-primary pt-0.5">
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>ویدیوی تجویزی: {p.videoTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {p.status === 'RECOVERED' ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> جبران و تثبیت شد
                      </Badge>
                    ) : p.status === 'WATCHED' ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">
                        تماشا شده · منتظر آزمونک مجدد
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                        در انتظار تماشای ویدیو
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Exams Table */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              کارنامه آخرین آزمونک‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="font-semibold">{a.examTitle}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.chapterTitle || 'آزمون جامع'} · {a.finishedAt ? faDate(new Date(a.finishedAt)) : '—'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                      <span className="text-emerald-600 font-bold">{toFa(a.correctCount)} ص</span>
                      <span>/</span>
                      <span className="text-red-600 font-bold">{toFa(a.wrongCount)} غ</span>
                      <span>/</span>
                      <span className="text-amber-600">{toFa(a.blankCount)} ن</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-sm font-bold min-w-[54px] justify-center',
                        a.score >= 15 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : a.score >= 10 ? 'bg-amber-500/15 text-amber-700' : 'bg-red-500/15 text-red-700',
                      )}
                    >
                      {toFaNumber(a.score, 1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Support Notice */}
        <div className="rounded-2xl border bg-muted/40 p-5 text-center space-y-2 text-xs text-muted-foreground print:hidden">
          <div className="font-bold text-foreground text-sm">همراهی گام‌به‌گام با اولیاء تا روز کنکور</div>
          <p>این کارنامه بر اساس داده‌های دقیق سامانه آموزشی و مکمل کلاس‌های حضوری صادر شده است.</p>
          <div className="pt-2 flex justify-center">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              ارتباط با مدیر آموزشگاه
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

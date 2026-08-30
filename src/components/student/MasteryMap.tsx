'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Brain, Sparkles, Target, CheckCircle2, AlertTriangle, PlayCircle, Flame, ArrowLeft } from 'lucide-react'
import { MasteryDot } from '@/components/shared/MasteryDot'
import { toFa, toFaNumber } from '@/lib/fa'
import { cn } from '@/lib/utils'

type Mastery = {
  chapters: {
    chapterId: string
    title: string
    slug: string
    order: number
    ratio: number | null
    level: 'green' | 'yellow' | 'red' | 'none'
    topics: {
      topicId: string
      title: string
      slug: string
      correct: number
      total: number
      ratio: number | null
      level: 'green' | 'yellow' | 'red' | 'none'
    }[]
  }[]
}

export function MasteryMap({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Mastery | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')

  useEffect(() => {
    fetch('/api/student/mastery')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data || !Array.isArray(data.chapters)) return <Skeleton className="h-96 rounded-2xl" />

  // Calculate global summary counts
  let totalTopics = 0
  let greenTopics = 0
  let yellowTopics = 0
  let redTopics = 0

  data.chapters.forEach((ch) => {
    ;(ch.topics || []).forEach((t) => {
      totalTopics++
      if (t.level === 'green') greenTopics++
      else if (t.level === 'yellow') yellowTopics++
      else if (t.level === 'red') redTopics++
    })
  })

  const overallMasteryPct = totalTopics > 0 ? Math.round((greenTopics / totalTopics) * 100) : 0

  return (
    <div className="space-y-6 page-enter max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>درخت تسلط مفهومی فیزیک کنکور (الگوی Brilliant)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            نقشه مفهومی تسلط سرفصل‌ها
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            مشخص است در کدام ریزمباحث قوی هستید و کدام نقاط به درمان و تمرین نیاز دارند.
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="self-start sm:self-auto gap-1.5 rounded-xl text-xs h-9">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>بازگشت به داشبورد</span>
        </Button>
      </div>

      {/* Global Mastery Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card shadow-2xs border-primary/20 p-3.5">
          <div className="text-[11px] font-semibold text-muted-foreground">میانگین تسلط کل</div>
          <div className="text-2xl font-black text-primary stat-num mt-1">{toFa(overallMasteryPct)}٪</div>
          <Progress value={overallMasteryPct} className="h-1.5 mt-2" />
        </Card>
        <Card className="glass-card shadow-2xs border-emerald-500/30 bg-emerald-500/5 p-3.5">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">🟢 مباحث با تسلط کامل</div>
          <div className="text-2xl font-black text-emerald-600 stat-num mt-1">{toFa(greenTopics)} <span className="text-xs font-normal text-muted-foreground">مبحث</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">دقت پاسخگویی بالای ۷۵٪</div>
        </Card>
        <Card className="glass-card shadow-2xs border-amber-500/30 bg-amber-500/5 p-3.5">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">🟡 نیازمند تثبیت و تمرین</div>
          <div className="text-2xl font-black text-amber-600 stat-num mt-1">{toFa(yellowTopics)} <span className="text-xs font-normal text-muted-foreground">مبحث</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">دقت ۵۰ تا ۷۵ درصد</div>
        </Card>
        <Card className="glass-card shadow-2xs border-red-500/30 bg-red-500/5 p-3.5">
          <div className="text-[11px] font-semibold text-red-700 dark:text-red-400">🔴 ضعف‌های نیازمند جبران</div>
          <div className="text-2xl font-black text-red-600 stat-num mt-1">{toFa(redTopics)} <span className="text-xs font-normal text-muted-foreground">مبحث</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">نیازمند مشاهده ویدیو و آزمونک</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted',
          )}
        >
          تمام فصول ({toFa(data.chapters.length)})
        </button>
        <button
          onClick={() => setActiveFilter('red')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeFilter === 'red' ? 'bg-red-500 text-white shadow-xs' : 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
          )}
        >
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>فقط ضعف‌های بحرانی ({toFa(redTopics)})</span>
        </button>
        <button
          onClick={() => setActiveFilter('yellow')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeFilter === 'yellow' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20',
          )}
        >
          نیازمند تمرین ({toFa(yellowTopics)})
        </button>
        <button
          onClick={() => setActiveFilter('green')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeFilter === 'green' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20',
          )}
        >
          تسلط کامل ({toFa(greenTopics)})
        </button>
      </div>

      {/* Chapters & Topics Concept Grid */}
      <div className="space-y-4">
        {data.chapters.map((ch) => {
          const visibleTopics = ch.topics.filter((t) => {
            if (activeFilter === 'all') return true
            return t.level === activeFilter
          })

          if (visibleTopics.length === 0) return null

          const chapterPct = ch.ratio !== null ? Math.round(ch.ratio * 100) : null

          return (
            <Card key={ch.chapterId} className="glass-card shadow-sm border-primary/20 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black text-sm">
                      {toFa(ch.order)}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-semibold">فصل {toFa(ch.order)} فیزیک</div>
                      <CardTitle className="text-base font-extrabold">{ch.title}</CardTitle>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {chapterPct !== null ? (
                      <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-xl border">
                        <span className="text-xs text-muted-foreground">میانگین تسلط فصل:</span>
                        <span
                          className={cn(
                            'text-sm font-black stat-num',
                            ch.level === 'green' && 'text-emerald-600',
                            ch.level === 'yellow' && 'text-amber-600',
                            ch.level === 'red' && 'text-red-600',
                          )}
                        >
                          {toFa(chapterPct)}٪
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        هنوز آزمونی ثبت نشده
                      </Badge>
                    )}
                    <MasteryDot level={ch.level} size="lg" pulse={ch.level === 'red'} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleTopics.map((t) => {
                    const pct = t.ratio !== null ? Math.round(t.ratio * 100) : null

                    return (
                      <div
                        key={t.topicId}
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all space-y-2.5 card-interactive',
                          t.level === 'green' && 'border-emerald-500/40 bg-emerald-500/5',
                          t.level === 'yellow' && 'border-amber-500/40 bg-amber-500/5',
                          t.level === 'red' && 'border-red-500/40 bg-red-500/5 cell-red',
                          t.level === 'none' && 'border-border/60 bg-card/60',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs sm:text-sm text-foreground flex-1 leading-snug">
                            {t.title}
                          </div>
                          <MasteryDot level={t.level} size="md" pulse={t.level === 'red'} />
                        </div>

                        {t.total > 0 ? (
                          <div className="space-y-1">
                            <Progress
                              value={pct ?? 0}
                              className={cn(
                                'h-1.5',
                                t.level === 'green' && '[&>div]:bg-emerald-500',
                                t.level === 'yellow' && '[&>div]:bg-amber-500',
                                t.level === 'red' && '[&>div]:bg-red-500',
                              )}
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>
                                {toFa(t.correct)} از {toFa(t.total)} تست صحیح
                              </span>
                              <span className="font-bold font-mono text-foreground">{toFa(pct ?? 0)}٪</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground">تستی برای این مبحث حل نشده</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

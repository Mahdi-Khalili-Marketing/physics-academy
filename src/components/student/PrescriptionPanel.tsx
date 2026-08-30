'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Stethoscope,
  PlayCircle,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'
import { toFa, formatDuration } from '@/lib/fa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Prescription = {
  id: string
  status: 'PENDING' | 'WATCHED' | 'RECOVERED'
  reason: string
  topicTitle: string
  chapterTitle: string
  video: { id: string; title: string; durationSec: number } | null
  remedialExamId: string | null
  lastRemedialScore: number | null
}

const STATUS_META: Record<string, { label: string; step: number; className: string }> = {
  PENDING: {
    label: 'در انتظار مشاهده درس',
    step: 1,
    className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  },
  WATCHED: {
    label: 'آماده آزمونک تثبیت',
    step: 2,
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  RECOVERED: {
    label: 'درمان و تثبیت شد',
    step: 3,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
}

export function PrescriptionPanel({
  onOpenVideo,
  onOpenExam,
}: {
  onOpenVideo: (videoId: string) => void
  onOpenExam: (examId: string) => void
}) {
  const [items, setItems] = useState<Prescription[] | null>(null)
  const [spotLicense, setSpotLicense] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  function loadPrescriptions() {
    fetch('/api/student/prescriptions')
      .then((r) => (r.ok ? r.json() : { prescriptions: [] }))
      .then((d) => {
        setItems(d.prescriptions ?? [])
        if (d.spotPlayerLicense) setSpotLicense(d.spotPlayerLicense)
      })
      .catch(() => setItems([]))
  }

  useEffect(() => {
    loadPrescriptions()
  }, [])

  async function handleMarkWatched(prescriptionId: string) {
    setMarkingId(prescriptionId)
    try {
      const res = await fetch('/api/student/prescriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId }),
      })
      if (res.ok) {
        toast.success('مشاهده ویدیو ثبت شد؛ آزمونک تسلط فعال گردید.')
        loadPrescriptions()
      } else {
        toast.error('خطا در ثبت وضعیت')
      }
    } catch {
      toast.error('خطای ارتباط با سرور')
    } finally {
      setMarkingId(null)
    }
  }

  async function startRemedial(id: string) {
    try {
      const res = await fetch(`/api/student/prescriptions/${id}/remedial`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در ساخت آزمون مجدد')
        return
      }
      onOpenExam(data.examId)
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور')
    }
  }

  function handleCopyLicense() {
    if (!spotLicense) return
    navigator.clipboard.writeText(spotLicense)
    setCopied(true)
    toast.success('کد لایسنس اسپات‌پلیر در حافظه کپی شد.')
    setTimeout(() => setCopied(false), 2000)
  }

  if (items === null) return <Skeleton className="h-40 rounded-2xl" />
  if (items.length === 0) return null

  const active = items.filter((p) => p.status !== 'RECOVERED')
  const recovered = items.filter((p) => p.status === 'RECOVERED').slice(0, 4)

  return (
    <Card className="glass-card shadow-sm border-primary/20 overflow-hidden space-y-0">
      <CardHeader className="bg-primary/5 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Stethoscope className="h-4 w-4" />
              </div>
              نسخه آموزشی و چرخه درمان ضعف‌ها
            </CardTitle>
            <CardDescription className="text-xs">
              برنامه اقدام مشخص برای هر ضعف: ویدیو را در اسپات‌پلیر ببین ➔ آزمونک بده ➔ تگ را سبز کن.
            </CardDescription>
          </div>
          {active.length > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
              {toFa(active.length)} ضعف فعال
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* SpotPlayer DRM Notice Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-foreground">پخش امن ویدیوها در اسپات‌پلیر (SpotPlayer): </span>
              <span className="text-muted-foreground">
                {spotLicense ? 'لایسنس فعال شما صادر شده است.' : 'لایسنس توسط مدیریت آموزشگاه صادر می‌شود.'}
              </span>
            </div>
          </div>
          {spotLicense && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLicense}
                className="h-7 px-2.5 text-xs gap-1 font-mono border-primary/30"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                کپی لایسنس
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs gap-1"
              >
                <a href="https://app.spotplayer.net" target="_blank" rel="noreferrer">
                  وب‌پلیر اسپات‌پلیر
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>

        {active.map((p) => {
          const meta = STATUS_META[p.status] || STATUS_META.PENDING
          const isPendingVideo = p.status === 'PENDING'

          return (
            <div
              key={p.id}
              className={cn(
                'rounded-2xl border p-4 transition-all space-y-3',
                isPendingVideo
                  ? 'border-red-500/30 bg-red-500/5 dark:bg-red-950/10'
                  : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10',
              )}
            >
              {/* Header & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">{p.topicTitle}</span>
                  <Badge variant="outline" className="text-[10px]">
                    فصل {p.chapterTitle}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px] font-semibold', meta.className)}>
                    {meta.label}
                  </Badge>
                </div>
              </div>

              {/* Reason Explanation */}
              <div className="text-xs text-muted-foreground leading-relaxed">
                🩺 <span className="font-medium text-foreground">تشخیص سیستم:</span> {p.reason}
              </div>

              {p.lastRemedialScore !== null && p.status !== 'RECOVERED' && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg p-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    آخرین آزمونک مجدد: {toFa(p.lastRemedialScore)} از ۲۰ — هنوز به حد قبولی (۱۴ از ۲۰) نرسیده است.
                  </span>
                </div>
              )}

              {/* Action Stepper Bar */}
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* 3 Step Visual Indicators */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      meta.step >= 1 ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted',
                    )}
                  >
                    ۱. تشخیص
                  </span>
                  <span>←</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      meta.step >= 2 ? 'bg-primary text-primary-foreground font-bold' : isPendingVideo ? 'bg-amber-500/20 text-amber-800' : 'bg-muted',
                    )}
                  >
                    ۲. اسپات‌پلیر
                  </span>
                  <span>←</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      meta.step >= 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-muted',
                    )}
                  >
                    ۳. آزمونک تسلط
                  </span>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isPendingVideo && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markingId === p.id}
                      onClick={() => handleMarkWatched(p.id)}
                      className="gap-1 text-xs h-8 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {markingId === p.id ? '...' : 'تایید تماشای ویدیو'}
                    </Button>
                  )}
                  {p.video && (
                    <Button
                      size="sm"
                      variant={isPendingVideo ? 'default' : 'outline'}
                      onClick={() => onOpenVideo(p.video!.id)}
                      className={cn('gap-1.5 text-xs h-8', isPendingVideo && 'shadow-xs')}
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      مشاهده درس ({formatDuration(p.video.durationSec)})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={!isPendingVideo ? 'default' : 'outline'}
                    onClick={() => startRemedial(p.id)}
                    className={cn('gap-1.5 text-xs h-8', !isPendingVideo && 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs')}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    آزمونک سنجش مجدد
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Recovered Items History */}
        {recovered.length > 0 && (
          <div className="pt-2 border-t space-y-1.5">
            <div className="text-[11px] font-bold text-muted-foreground">ضعف‌های اخیراً جبران و تثبیت‌شده:</div>
            <div className="flex flex-wrap gap-2">
              {recovered.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{p.topicTitle}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

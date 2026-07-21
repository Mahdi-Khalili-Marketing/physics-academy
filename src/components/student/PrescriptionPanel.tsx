'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Stethoscope, PlayCircle, RefreshCcw, CheckCircle2 } from 'lucide-react'
import { toFa, formatDuration } from '@/lib/fa'
import { toast } from 'sonner'

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

const STATUS_META = {
  PENDING: { label: 'در انتظار مشاهده', className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30' },
  WATCHED: { label: 'آمادهٔ آزمون مجدد', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  RECOVERED: { label: 'برطرف شد', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
} as const

export function PrescriptionPanel({
  onOpenVideo,
  onOpenExam,
}: {
  onOpenVideo: (videoId: string) => void
  onOpenExam: (examId: string) => void
}) {
  const [items, setItems] = useState<Prescription[] | null>(null)

  useEffect(() => {
    fetch('/api/student/prescriptions')
      .then((r) => r.json())
      .then((d) => setItems(d.prescriptions ?? []))
      .catch(() => setItems([]))
  }, [])

  async function startRemedial(id: string) {
    const res = await fetch(`/api/student/prescriptions/${id}/remedial`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'خطا در ساخت آزمون مجدد')
      return
    }
    onOpenExam(data.examId)
  }

  if (items === null) return <Skeleton className="h-40" />
  if (items.length === 0) return null

  const active = items.filter((p) => p.status !== 'RECOVERED')
  const recovered = items.filter((p) => p.status === 'RECOVERED').slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          نسخهٔ من
        </CardTitle>
        <CardDescription>
          تشخیص و تجویز دقیق برای هر ضعف — ویدیو را ببین، آزمون مجدد بده، ضعف را ببند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.map((p) => {
          const meta = STATUS_META[p.status]
          return (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{p.topicTitle}</span>
                  <Badge variant="outline" className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.reason} · {p.chapterTitle}
                </div>
                {p.lastRemedialScore !== null && p.status !== 'RECOVERED' && (
                  <div className="text-xs text-amber-600 mt-1">
                    آخرین آزمون مجدد: {toFa(p.lastRemedialScore)} از ۲۰ — هنوز به حد قبولی نرسیده
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {p.video && (
                  <Button
                    size="sm"
                    variant={p.status === 'PENDING' ? 'default' : 'outline'}
                    onClick={() => onOpenVideo(p.video!.id)}
                    className="gap-1"
                  >
                    <PlayCircle className="h-4 w-4" />
                    دیدن ویدیو ({formatDuration(p.video.durationSec)})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={p.status === 'WATCHED' ? 'default' : 'outline'}
                  onClick={() => startRemedial(p.id)}
                  className="gap-1"
                >
                  <RefreshCcw className="h-4 w-4" /> آزمون مجدد
                </Button>
              </div>
            </div>
          )
        })}
        {recovered.length > 0 && (
          <div className="pt-2 space-y-1">
            {recovered.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="line-through">{p.topicTitle}</span>
                <span>— برطرف شد</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

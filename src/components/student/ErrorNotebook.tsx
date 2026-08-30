'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { BookMarked, CheckCircle2, Trash2, RefreshCcw } from 'lucide-react'
import { toFa, relativeTime } from '@/lib/fa'
import { toast } from 'sonner'
import { MathText } from '@/components/shared/MathText'

type Entry = {
  id: string
  questionId: string
  stem: string
  correctOption: 'A' | 'B' | 'C' | 'D'
  selected: 'A' | 'B' | 'C' | 'D' | null
  chapterTitle: string
  topicTitle: string
  resolved: boolean
  createdAt: string
}

export function ErrorNotebook({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/error-notebook')
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .finally(() => setLoading(false))
  }, [])

  async function toggleResolved(id: string, resolved: boolean) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, resolved } : e)))
    await fetch('/api/student/error-notebook', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved }),
    })
    toast.success(resolved ? 'به‌عنوان مرورشده علامت زده شد' : 'دوباره به فهرست بازگشت')
  }

  const unresolved = entries.filter((e) => !e.resolved)
  const resolved = entries.filter((e) => e.resolved)

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-red-600" />
            دفتر اشتباهات خودکار
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            همه غلط‌ها خودبه‌خود جمع می‌شوند — تا شب آزمون فقط همان‌ها را مرور کنید.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-red-600">{toFa(unresolved.length)}</div>
            <div className="text-xs text-muted-foreground mt-1">اشتباه مرور‌نشده</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-emerald-600">{toFa(resolved.length)}</div>
            <div className="text-xs text-muted-foreground mt-1">مرورشده ✓</div>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
            <p>دفتر اشتباهات شما خالی است. آفرین!</p>
            <p className="text-xs mt-1">با دادن آزمون، اشتباهات خودکار اینجا جمع می‌شوند.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...unresolved, ...resolved].map((e) => (
            <Card
              key={e.id}
              className={e.resolved ? 'opacity-60' : 'border-red-500/30'}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{e.chapterTitle}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{e.topicTitle}</Badge>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(new Date(e.createdAt))}</span>
                    </div>
                    <MathText text={e.stem} className="font-medium text-sm leading-relaxed" as="div" />
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="text-red-600">
                        پاسخ شما: <span className="font-bold">{e.selected ? toFa(e.selected) : 'نزده'}</span>
                      </span>
                      <span className="text-emerald-600">
                        پاسخ صحیح: <span className="font-bold">{toFa(e.correctOption)}</span>
                      </span>
                    </div>
                  </div>
                  <Checkbox
                    checked={e.resolved}
                    onCheckedChange={(v) => toggleResolved(e.id, !!v)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

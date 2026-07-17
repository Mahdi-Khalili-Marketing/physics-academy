'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sparkles, Plus, RotateCw, Check, X, Layers } from 'lucide-react'
import { toFa, faDate } from '@/lib/fa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Card = {
  id: string
  front: string
  back: string
  box: number
  nextReview: string
  reviewCount: number
  due: boolean
}

export function LeitnerBox({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  useEffect(() => {
    fetch('/api/student/leitner')
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .finally(() => setLoading(false))
  }, [])

  async function addCard() {
    if (!front || !back) {
      toast.error('متن کارت را کامل کنید.')
      return
    }
    const res = await fetch('/api/student/leitner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back }),
    })
    const data = await res.json()
    setCards((prev) => [{ ...data.card, due: true }, ...prev])
    setFront('')
    setBack('')
    setOpen(false)
    toast.success('کارت اضافه شد')
  }

  async function reviewCard(id: string, correct: boolean) {
    const res = await fetch(`/api/student/leitner/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct }),
    })
    const data = await res.json()
    setCards((prev) => prev.map((c) => (c.id === id ? { ...data.card, due: new Date(data.card.nextReview) <= new Date() } : c)))
    setReviewing(null)
    setShowAnswer(false)
    toast.success(correct ? '✓ درست — کارت یک جعبه بالاتر رفت' : '✗ اشتباه — کارت به جعبه ۱ برگشت')
  }

  if (loading) return <Skeleton className="h-96" />

  const dueCards = cards.filter((c) => c.due)
  const byBox: Record<number, Card[]> = {}
  for (const c of cards) {
    if (!byBox[c.box]) byBox[c.box] = []
    byBox[c.box].push(c)
  }

  const currentReview = reviewing ? cards.find((c) => c.id === reviewing) : null

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            جعبه لایتنر فرمول‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-1">مرور فرمول‌ها و مفاهیم کلیدی با روش آشنای لایتنر</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> کارت جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزودن کارت لایتنر</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>روی کارت (فرمول یا مفهوم)</Label>
                  <Input value={front} onChange={(e) => setFront(e.target.value)} placeholder="مثلاً: قانون دوم نیوتن" />
                </div>
                <div className="space-y-1.5">
                  <Label>پشت کارت (پاسخ)</Label>
                  <Textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="مثلاً: F = ma" />
                </div>
                <Button onClick={addCard} className="w-full">افزودن</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={onBack}>بازگشت</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{toFa(cards.length)}</div>
            <div className="text-xs text-muted-foreground mt-1">کل کارت‌ها</div>
          </CardContent>
        </Card>
        <Card className={dueCards.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{toFa(dueCards.length)}</div>
            <div className="text-xs text-muted-foreground mt-1">امروز باید مرور شوند</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{toFa(cards.length - dueCards.length)}</div>
            <div className="text-xs text-muted-foreground mt-1">مرورشده</div>
          </CardContent>
        </Card>
      </div>

      {/* Review session */}
      {currentReview && (
        <Card className="border-2 border-purple-500/40">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-sm text-muted-foreground">روی کارت:</div>
            <div className="text-2xl font-bold">{currentReview.front}</div>
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} size="lg" className="gap-2">
                <RotateCw className="h-4 w-4" /> نمایش پاسخ
              </Button>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">پشت کارت:</div>
                <div className="text-xl font-mono bg-muted p-4 rounded-lg">{currentReview.back}</div>
                <div className="text-sm text-muted-foreground">آیا درست یادآوری کردید؟</div>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => reviewCard(currentReview.id, false)} variant="destructive" className="gap-2">
                    <X className="h-4 w-4" /> اشتباه
                  </Button>
                  <Button onClick={() => reviewCard(currentReview.id, true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Check className="h-4 w-4" /> درست
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Due review queue */}
      {!currentReview && dueCards.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold">{toFa(dueCards.length)} کارت برای مرور امروز</div>
              <div className="text-sm text-muted-foreground mt-1">با هر مرور درست، کارت به جعبه بعد می‌رود و دیرتر دوباره نمایش داده می‌شود.</div>
            </div>
            <Button onClick={() => setReviewing(dueCards[0].id)} className="gap-2">
              <RotateCw className="h-4 w-4" /> شروع مرور
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All cards grouped by box */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" /> همه کارت‌ها بر اساس جعبه
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((boxNum) => {
          const boxCards = byBox[boxNum] || []
          if (boxCards.length === 0) return null
          return (
            <div key={boxNum} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">جعبه {toFa(boxNum)}</Badge>
                <span className="text-xs text-muted-foreground">
                  مرور بعدی: {boxCards[0] ? faDate(new Date(boxCards[0].nextReview)) : '—'}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {boxCards.map((c) => (
                  <Card key={c.id} className={cn('hover-lift', c.due && 'border-amber-500/40')}>
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{c.front}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{c.back}</div>
                      {c.due && (
                        <Badge variant="secondary" className="mt-2 text-[10px] bg-amber-500/20">زود مرور شود</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

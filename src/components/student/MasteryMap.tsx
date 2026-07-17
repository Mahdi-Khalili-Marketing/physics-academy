'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Brain, ChevronRight } from 'lucide-react'
import { MasteryDot } from '@/components/shared/MasteryDot'
import { toFa, toFaNumber } from '@/lib/fa'

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

  useEffect(() => {
    fetch('/api/student/mastery')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />
  if (!data) return null

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-teal-600" />
            نقشه تسلط من
          </h1>
          <p className="text-muted-foreground text-sm mt-1">مشخص است کجا قوی هستید و کجا باید تمرین کنید.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <MasteryDot level="green" label="تسلط ≥ ۷۵٪" />
        <MasteryDot level="yellow" label="نیازمند تمرین ۵۰–۷۵٪" />
        <MasteryDot level="red" label="ضعف < ۵۰٪" pulse />
        <MasteryDot level="none" label="بدون داده" />
      </div>

      <Accordion type="single" collapsible defaultValue="">
        {data.chapters.map((ch) => (
          <AccordionItem key={ch.chapterId} value={ch.chapterId}>
            <Card className="mb-2">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3 flex-1 pr-2">
                  <MasteryDot level={ch.level} size="lg" pulse />
                  <div className="flex-1 text-right">
                    <div className="text-xs text-muted-foreground">فصل {toFa(ch.order)}</div>
                    <div className="font-medium">{ch.title}</div>
                  </div>
                  {ch.ratio !== null && (
                    <Badge variant="outline" className={ch.level === 'green' ? 'border-emerald-500/40 text-emerald-700' : ch.level === 'yellow' ? 'border-amber-500/40 text-amber-700' : ch.level === 'red' ? 'border-red-500/40 text-red-700' : ''}>
                      {toFaNumber(ch.ratio * 100)}٪
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4 pt-2 space-y-2">
                  {ch.topics.map((t) => (
                    <div key={t.topicId} className="flex items-center gap-3 p-2 rounded-lg border">
                      <MasteryDot level={t.level} size="md" pulse={t.level === 'red'} />
                      <div className="flex-1">
                        <div className="text-sm">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {toFa(t.correct)} از {toFa(t.total)} پاسخ صحیح
                        </div>
                      </div>
                      {t.ratio !== null && (
                        <span className={`text-sm font-bold ${t.level === 'green' ? 'text-emerald-600' : t.level === 'yellow' ? 'text-amber-600' : t.level === 'red' ? 'text-red-600' : ''}`}>
                          {toFaNumber(t.ratio * 100)}٪
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

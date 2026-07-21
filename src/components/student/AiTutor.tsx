'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'اصطکاک در سطح شیب‌دار را ساده توضیح بده',
  'فرق سرعت متوسط و سرعت لحظه‌ای چیست؟',
  'یک مسئله سقوط آزاد برایم حل کن',
  'قانون لنز را با یک مثال توضیح بده',
]

export function AiTutor({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [demo, setDemo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: messages.slice(-10) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در ارتباط')
        setMessages((prev) => prev.slice(0, -1))
        return
      }
      setDemo(!!data.demo)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      toast.error('ارتباط برقرار نشد')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto page-enter flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            معلم هوشمند
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            هر ساعتی از شبانه‌روز سؤال فیزیکت را بپرس — قدم‌به‌قدم جواب می‌گیری.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {demo && <Badge variant="outline" className="bg-amber-500/10 text-amber-700">حالت دمو</Badge>}
          <Button variant="ghost" onClick={onBack}>بازگشت</Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
              <Sparkles className="h-10 w-10 text-teal-500/50" />
              <p className="text-muted-foreground text-sm">
                ساعت ۲ نصفه‌شب گیر کردی؟ همین‌جا بپرس.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs rounded-full border px-3 py-1.5 hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  m.role === 'user' ? 'bg-muted' : 'bg-primary/15 text-primary',
                )}
              >
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[85%]',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted/60 rounded-tl-sm chat-md',
                )}
              >
                {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:150ms]">●</span>
                  <span className="animate-bounce [animation-delay:300ms]">●</span>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <div className="border-t p-3 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="سؤال فیزیکت را بنویس…"
            className="resize-none min-h-[44px] max-h-32"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4 -scale-x-100" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

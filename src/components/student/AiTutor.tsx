'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, Sparkles, User, Copy, Check, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MathText } from '@/components/shared/MathText'

function CustomMarkdownNode({ node }: { node: React.ReactNode }): React.ReactElement {
  if (typeof node === 'string') {
    return <MathText text={node} />
  }
  if (Array.isArray(node)) {
    return (
      <>
        {node.map((child, idx) => (
          <React.Fragment key={idx}>
            <CustomMarkdownNode node={child} />
          </React.Fragment>
        ))}
      </>
    )
  }
  return <>{node}</>
}

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  '⚡ چطور بفهمم اصطکاک در جهت حرکته یا خلافش؟',
  '📐 فرق سرعت متوسط و سرعت لحظه‌ای با فرمول چیه؟',
  '🎯 یک تست سخت حرکت با شتاب ثابت برام حل کن',
  '🧲 قانون لنز و جهت جریان القایی رو ساده بگو',
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

      <Card className="glass-card shadow-lg border-primary/20 flex-1 flex flex-col overflow-hidden">
        {/* Khanmigo Socratic Action Bar */}
        <div className="border-b bg-muted/40 p-2.5 px-4 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-bold text-[11px] text-foreground">نردبان راهنمایی سقراطی:</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => send('لطفاً فقط ایده کلی، فرمول اصلی و دام تستی این مسئله را بگو (بدون حل عددی).')}
              className="px-2.5 py-1 rounded-lg border bg-background hover:bg-primary/10 hover:border-primary/40 text-[11px] font-medium transition-colors cursor-pointer"
            >
              💡 راهنمایی ۱: فرمول
            </button>
            <button
              onClick={() => send('فرمول را دارم؛ لطفاً فقط نحوه جایگذاری متغیرها و تبدیل واحدها را نشان بده.')}
              className="px-2.5 py-1 rounded-lg border bg-background hover:bg-primary/10 hover:border-primary/40 text-[11px] font-medium transition-colors cursor-pointer"
            >
              📐 راهنمایی ۲: جایگذاری
            </button>
            <button
              onClick={() => send('لطفاً حل کامل تشریحی به همراه محاسبه مرحله‌به‌مرحله و پاسخ نهایی را بنویس.')}
              className="px-2.5 py-1 rounded-lg border bg-background hover:bg-primary/10 hover:border-primary/40 text-[11px] font-medium transition-colors cursor-pointer"
            >
              ✍️ حل کامل تشریحی
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="px-2 py-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 text-[11px] transition-colors cursor-pointer"
              >
                پاک کردن گفتگو
              </button>
            )}
          </div>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
              <div className="h-16 w-16 rounded-3xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-extrabold text-base">معلم اختصاصی فیزیک کنکور (الگوی Khanmigo)</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  هر سؤالی داری، هر ساعتی از شبانه‌روز بپرس. فرمول‌ها و مراحل حل را قدم‌به‌قدم تحلیلی یاد بگیر.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs rounded-full border bg-background/80 hover:bg-primary/10 hover:border-primary/40 px-3.5 py-2 transition-all cursor-pointer shadow-2xs text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-2.5 items-start', m.role === 'user' ? 'flex-row-reverse' : '')}>
              <div
                className={cn(
                  'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold',
                  m.role === 'user' ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
                )}
              >
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="space-y-1 max-w-[88%] group relative">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-xs'
                      : 'bg-card border border-border/70 rounded-tl-xs chat-md text-foreground',
                  )}
                >
                  {m.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <div className="my-1.5 leading-relaxed"><CustomMarkdownNode node={children} /></div>,
                        li: ({ children }) => <li className="my-0.5"><CustomMarkdownNode node={children} /></li>,
                        strong: ({ children }) => <strong><CustomMarkdownNode node={children} /></strong>,
                        em: ({ children }) => <em><CustomMarkdownNode node={children} /></em>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    <MathText text={m.content} />
                  )}
                </div>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content)
                      toast.success('پاسخ کپی شد')
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5"
                  >
                    <Copy className="h-3 w-3" />
                    <span>کپی پاسخ</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 items-start">
              <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-card border px-4 py-3 text-xs text-muted-foreground shadow-xs flex items-center gap-2">
                <span>معلم هوشمند در حال تحلیل و پاسخ…</span>
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
        <div className="border-t p-3 bg-muted/20 flex gap-2 items-end">
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
            placeholder="سؤال، فرمول یا تست فیزیکت را بنویس…"
            className="resize-none min-h-[46px] max-h-32 rounded-xl text-sm bg-background"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-[46px] w-[46px] rounded-xl shrink-0 shadow-xs">
            <Send className="h-4 w-4 -scale-x-100" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error Caught by boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="max-w-lg w-full bg-card border border-destructive/30 rounded-2xl p-6 shadow-xl space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">خطایی در بارگذاری صفحه رخ داد</h2>
        <div className="text-xs text-muted-foreground text-right bg-muted/60 p-3 rounded-xl font-mono dir-ltr overflow-x-auto max-h-40">
          {error.message || String(error)}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={() => reset()} className="gap-2 text-xs">
            <RefreshCcw className="h-4 w-4" /> بارگذاری مجدد
          </Button>
          <Button variant="outline" onClick={() => { window.location.href = '/login' }} className="gap-2 text-xs">
            <Home className="h-4 w-4" /> بازگشت به ورود
          </Button>
        </div>
      </div>
    </div>
  )
}

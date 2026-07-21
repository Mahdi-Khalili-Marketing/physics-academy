'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Atom, Lock, Phone, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const DEMO_ACCOUNTS = [
  { label: 'مدیر', phone: '09120000001', role: 'MANAGER' },
  { label: 'دبیر', phone: '09120000002', role: 'TEACHER' },
  { label: 'دانش‌آموز نمونه', phone: '09120010003', role: 'STUDENT' },
]

// Quick-login demo shortcuts are for local/dev use only — never expose real
// account access with no verification on a public production login page.
const SHOW_DEMO_LOGINS = process.env.NODE_ENV !== 'production'

export function AuthScreen() {
  const router = useRouter()
  const { fetchMe } = useAppStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'ورود ناموفق')
        return
      }
      toast.success(`خوش آمدید، ${data.user.name}`)
      await fetchMe()
      router.push('/app')
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  async function quickLogin(p: string) {
    setPhone(p)
    setPassword('1234')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p, password: '1234' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'ورود ناموفق')
        return
      }
      toast.success(`خوش آمدید، ${data.user.name}`)
      await fetchMe()
      router.push('/app')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Link
        href="/"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به صفحه اصلی
      </Link>
      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl w-full items-center">
        {/* Brand / pitch */}
        <div className="space-y-6 p-2 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Atom className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">آموزشگاه فیزیک</h1>
              <p className="text-sm text-muted-foreground">پلتفرم آموزشی هوشمند کنکور</p>
            </div>
          </div>
          <p className="text-lg leading-relaxed">
            مکمل کلاس‌های حضوری — نه جایگزین آن‌ها. سیستمی که ضعف هر دانش‌آموز را پیدا می‌کند،
            مسیر رفع آن را نشان می‌دهد و دبیر را با داده واقعی به کلاس می‌فرستد.
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { t: 'تشخیص', d: 'ریشه هر غلط' },
              { t: 'تجویز', d: 'درس مرتبط' },
              { t: 'تسلط', d: 'آزمون مجدد' },
            ].map((x, i) => (
              <div key={i} className="rounded-xl border bg-card p-3">
                <div className="font-bold text-primary">{x.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-xl border-0 lg:border">
          <CardHeader>
            <CardTitle className="text-xl">ورود به حساب</CardTitle>
            <CardDescription>برای ادامه وارد شوید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    className="pr-10"
                    dir="ltr"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'در حال ورود…' : 'ورود'}
              </Button>
            </form>

            {SHOW_DEMO_LOGINS && (
              <div className="mt-6">
                <div className="text-xs text-muted-foreground mb-2 text-center">ورود سریع برای دمو:</div>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <Button
                      key={a.phone}
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin(a.phone)}
                      disabled={submitting}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

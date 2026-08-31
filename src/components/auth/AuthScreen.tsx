'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Atom, Lock, Phone, ArrowLeft, GraduationCap, Users, UserCog, Sparkles, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DEMO_ACCOUNTS = [
  {
    role: 'STUDENT',
    label: 'دانش‌آموز',
    name: 'علی کریمی (کنکوری)',
    phone: '09120010003',
    icon: GraduationCap,
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
  },
  {
    role: 'TEACHER',
    label: 'دبیر فیزیک',
    name: 'استاد رضایی',
    phone: '09120000002',
    icon: Users,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  },
  {
    role: 'MANAGER',
    label: 'مدیر آموزشگاه',
    name: 'مدیریت آکادمی',
    phone: '09120000001',
    icon: UserCog,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
]

export function AuthScreen() {
  const router = useRouter()
  const { fetchMe } = useAppStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('شماره موبایل را وارد کنید.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: password || '1234' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'ورود ناموفق')
        return
      }
      toast.success(`خوش آمدید، ${data.user.name}`)
      await fetchMe()
      window.location.href = '/app'
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور')
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
      window.location.href = '/app'
    } catch {
      toast.error('خطا در ورود سریع')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg relative">
      {/* Top Actions: Theme Switcher & Back to Home */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="تغییر حالت شب و روز"
          className="h-8 w-8 rounded-lg hover:bg-secondary border border-border/80 bg-background/80 backdrop-blur shadow-2xs text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </Button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border border-border shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>بازگشت به صفحه اصلی</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 max-w-5xl w-full items-center">
        {/* Brand Showcase */}
        <div className="lg:col-span-6 space-y-6 p-2 lg:p-6 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
              <Atom className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">آموزشگاه تخصصی فیزیک</h1>
              <p className="text-xs text-muted-foreground">پلتفرم آموزشی و تشخیصی کنکور</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold leading-tight">
              یک حساب کاربری، دسترسی به تمام ابزارهای تسلط
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              با شماره موبایل ثبت‌نام‌شده وارد شوید تا آزمونک‌ها، دفترچه اشتباهات و نسخه اختصاصی خود را مشاهده کنید.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>پخش امن ویدیوها با درج واترمارک هویتی</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>همگام‌سازی لحظه‌ای با کلاس حضوری</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>کارنامه تحلیلی پیامکی برای اولیاء</span>
            </div>
          </div>
        </div>

        {/* Login Box */}
        <div className="lg:col-span-6">
          <Card className="glass-card shadow-2xl border-primary/20 p-6 sm:p-8 space-y-6">
            <CardHeader className="p-0 text-center space-y-1.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto lg:hidden mb-2">
                <Atom className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-extrabold">ورود به سامانه</CardTitle>
              <CardDescription className="text-xs">
                شماره موبایل و رمز عبور خود را وارد نمایید
              </CardDescription>
            </CardHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">شماره موبایل</Label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09120000000"
                    dir="ltr"
                    className="pr-9 h-11 text-sm text-left font-mono rounded-xl bg-background/80"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">رمز عبور</Label>
                  <span className="text-[10px] text-muted-foreground">(پیش‌فرض حساب‌های دمو: 1234)</span>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="pr-9 h-11 text-sm text-left rounded-xl bg-background/80"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 font-bold text-sm rounded-xl shadow-md gap-2"
              >
                {submitting ? 'در حال ورود…' : 'ورود به پنل'}
              </Button>
            </form>

            {/* One-Click Quick Demo Switcher */}
            <div className="space-y-2.5 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  ورود سریع تستی (نسخه دمو):
                </span>
                <span className="text-[10px]">یک کلیک برای ورود</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={submitting}
                      onClick={() => quickLogin(acc.phone)}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer hover:border-primary hover:bg-primary/5 bg-background/60',
                        acc.color,
                      )}
                    >
                      <Icon className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-bold text-[11px] text-foreground">{acc.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{acc.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

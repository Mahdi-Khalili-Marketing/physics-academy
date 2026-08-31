'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  Atom,
  Bot,
  Target,
  BookOpen,
  Brain,
  BookMarked,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Users,
  GraduationCap,
  UserCog,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  HeartHandshake,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MathText } from '@/components/shared/MathText'
import { cn } from '@/lib/utils'
import { TEN_DAY_CAMP } from '@/lib/curriculum-10days'

const STEPS = [
  {
    icon: Target,
    step: '۱',
    title: 'تشخیص ریشه‌ای ضعف',
    body: 'سامانه صرفاً به غلط یا نزده نمره نمی‌دهد؛ ریشه دقیق اشتباه را در ریزمبحث فیزیک شناسایی می‌کند.',
    badge: 'دقت میلی‌متری',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Sparkles,
    step: '۲',
    title: 'تجویز نسخه اختصاصی',
    body: 'یک ویدیوی کوتاه زیر ۱۰ دقیقه و تمرین هدفمند متناسب با همان ضعف در کارتابل دانش‌آموز فعال می‌شود.',
    badge: 'آموزش میکرو',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Brain,
    step: '۳',
    title: 'آزمونک و تثبیت تسلط',
    body: 'با قبولی در آزمونک مجدد، پرونده ضعف بسته شده و تگ مربوطه در نقشه تسلط سبز و تثبیت می‌شود.',
    badge: 'تضمین بازدهی',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

const FEATURES = [
  {
    icon: Bot,
    title: 'معلم هوشمند فیزیک',
    body: 'دستیار ۲۴ ساعته مجهز به هوش مصنوعی که با اشراف کامل به سرفصل کنکور و نقاط ضعف شما، قدم‌به‌قدم راهنمایی می‌کند.',
    badge: 'AI Tutor',
  },
  {
    icon: Target,
    title: 'آزمون‌ساز استاندارد کنکور',
    body: 'آزمونک‌های موضوعی پس از هر جلسه کلاس، آزمون‌های جامع فصول و شبیه‌سازهای سنجش با فرمول‌های لاتک.',
    badge: 'سنجش دقیق',
  },
  {
    icon: BookOpen,
    title: 'کتابخانه ویدیویی ضدسرقت',
    body: 'ویدیوهای آموزشی جبرانی با پخش فوق‌العاده روان HLS و درج واترمارک هویتی نام و شماره موبایل بیننده.',
    badge: 'امنیت بالا',
  },
  {
    icon: Brain,
    title: 'نقشه جامع تسلط (Mastery Map)',
    body: 'نمای گرافیکی از وضعیت تمام فصول فیزیک دهم، یازدهم و دوازدهم؛ با تفکیک رنگی سبز، زرد و قرمز.',
    badge: 'داشبورد رشد',
  },
  {
    icon: BookMarked,
    title: 'دفترچه اشتباهات خودکار',
    body: 'تمام تست‌هایی که غلط زده‌اید یا نزده‌اید، بدون زحمت دست‌نویسی خودکار آرشیو شده و آماده مرور شب آزمون می‌شوند.',
    badge: 'صرفه‌جویی وقت',
  },
  {
    icon: Sparkles,
    title: 'جعبه لایتنر ۵ مرحله‌ای',
    body: 'مرور فاصله‌دار علمی فرمول‌ها و نکات تستی کلیدی دقیقا در لحظه‌ای که ذهن در آستانه فراموشی است.',
    badge: 'تثبیت حافظه',
  },
]

const ROLES_DATA = [
  {
    id: 'student',
    label: 'دانش‌آموزان کنکور',
    icon: GraduationCap,
    title: 'دیگر بعد از آزمون سردرگم نمی‌مانی',
    desc: 'به جای اینکه فقط درصد آزمون را ببینی، دقیقاً می‌دانی امشب باید کدام ۴ دقیقه ویدیو را ببینی و کدام ۳ تست را حل کنی تا ترازت بالا برود.',
    points: [
      'نسخه درمانی هوشمند بعد از هر آزمونک',
      'دفترچه خودکار تست‌های غلط',
      'معلم ۲۴ ساعته برای رفع اشکال نصف‌شب',
      'جعبه لایتنر مرور فرمول‌ها',
    ],
  },
  {
    id: 'teacher',
    label: 'دبیران فیزیک',
    icon: Users,
    title: 'با اشراف کامل به وضعیت کلاس وارد شو',
    desc: 'قبل از شروع هر جلسه، داشبورد به شما نشان می‌دهد کدام مبحث جلسه قبل برای بچه‌ها گنگ بوده و کدام تست‌ها بیشترین غلط را داشته‌اند.',
    points: [
      'تولید ۵ واریانت تست با هوش مصنوعی',
      'برچسب‌گذاری خودکار سطح دشواری و سرفصل',
      'بانک تست اختصاصی با فرمول‌های لاتک',
      'آزمونک فوری پس از پایان هر جلسه حضوری',
    ],
  },
  {
    id: 'manager',
    label: 'مدیر آموزشگاه',
    icon: UserCog,
    title: 'نظارت شفاف بر عملکرد و رضایت خانواده‌ها',
    desc: 'تک‌تک دانش‌آموزان را مانیتور کنید، هشدارهای افت تحصیلی را در نطفه شناسایی کنید و با کارنامه‌های دوره‌ای، وفاداری را بالا ببرید.',
    points: [
      'ارسال خودکار لینک کارنامه به موبایل اولیاء',
      'نمودار نرخ درگیری و فعالیت دانش‌آموزان',
      'مدیریت کلاس‌ها، دبیران و اشتراک‌ها',
      'سیستم هشدار زودهنگام افت تحصیلی',
    ],
  },
  {
    id: 'parents',
    label: 'اولیاء گرامی',
    icon: HeartHandshake,
    title: 'گزارش شفاف پیشرفت بدون نیاز به لاگین پیچیده',
    desc: 'پیامک هفتگی حاوی لینک اختصاصی برای شما ارسال می‌شود تا بدون نیاز به حفظ رمز عبور، روند رشد، مباحث ضعیف و تلاش فرزندتان را ببینید.',
    points: [
      'مشاهده آنلاین بدون نیاز به نام کاربری',
      'توصیه اختصاصی مشاور به والدین',
      'گزارش ویدیوهای دیده‌شده و زمان مطالعه',
      'امکان خروجی چاپی و PDF کارنامه',
    ],
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

function Reveal({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <div id={id} className={className}>{children}</div>
  return (
    <motion.div
      id={id}
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  )
}

export function LandingPage() {
  const [selectedRole, setSelectedRole] = useState(0)
  const [simSelectedOption, setSimSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [simSubmitted, setSimSubmitted] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  function handleSimChoice(opt: 'A' | 'B' | 'C' | 'D') {
    setSimSelectedOption(opt)
    setSimSubmitted(true)
  }

  function handleSimReset() {
    setSimSelectedOption(null)
    setSimSubmitted(false)
    setLeadSubmitted(false)
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leadName.trim() || !leadPhone.trim()) {
      return
    }
    setLeadSubmitting(true)
    try {
      const res = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          phone: leadPhone.trim(),
          weakTopicTitle: 'اصطکاک در سطح شیب‌دار',
          accuracyPct: simSelectedOption === 'B' ? 100 : 0,
        }),
      })
      if (res.ok) {
        setLeadSubmitted(true)
      }
    } catch {
      // ignore
    } finally {
      setLeadSubmitting(false)
    }
  }

  const currentRoleData = ROLES_DATA[selectedRole]
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground mesh-bg">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-panel">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
              <Atom className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-base leading-none block text-foreground">آکادمی تخصصی فیزیک</span>
              <span className="text-[11px] text-muted-foreground hidden sm:block">سیستم هوشمند تشخیص و نسخه کنکور</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground">
              <a href="#how-it-works">نحوه کارکرد</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground">
              <a href="#features">امکانات</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="تغییر حالت شب و روز"
              className="h-9 w-9 rounded-lg hover:bg-secondary border border-border text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>
            <Button asChild size="sm" className="gap-1.5 shadow-xs font-bold text-xs h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/login">
                ورود به سامانه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 lg:px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Pitch column */}
          <Reveal className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>دوره جامع جمع‌بندی فیزیک کنکور سراسری</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold leading-[1.32] tracking-tight text-foreground">
              یادگیری و تسلط بر فیزیک کنکور
              <span className="block text-primary mt-1">در ۱۰ روز با هوش مصنوعی</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              <span className="font-semibold text-foreground">۳ روز پایه دهم + ۳ روز پایه یازدهم + ۴ روز پایه دوازدهم</span>
              <br />
              سیستم هوشمند پس از هر آزمونک، ریشه دقیق افت درصد را شناسایی کرده و با صدور نسخه تجویزی، تسلط ۱۰۰٪ بر فیزیک را در ۱۰ روز تضمین می‌کند.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="lg" className="gap-2 shadow-sm hover:shadow-md transition-all h-11 px-5 rounded-lg text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/login">
                  ورود به پنل آموزشگاه
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5 rounded-lg text-xs sm:text-sm font-medium border-border bg-secondary/40 text-foreground hover:bg-secondary">
                <a href="#camp-roadmap">مشاهده نقشه ۱۰ روزه</a>
              </Button>
            </div>

            {/* Quick Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>۹۲+ تیپ تست کنکور</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>معلم ۲۴/۷ هوشمند</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>گزارش مستقیم والدین</span>
              </div>
            </div>
          </Reveal>

          {/* Interactive Hero Simulator Card */}
          <Reveal className="lg:col-span-6" id="simulator">
            <Card className="bg-card border border-border rounded-xl shadow-md overflow-hidden">
              <div className="bg-secondary/40 border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    شبیه‌ساز آزمون
                  </span>
                  <span className="text-xs font-semibold text-foreground">مبحث: اصطکاک در سطح شیب‌دار</span>
                </div>
                {simSubmitted && (
                  <Button variant="ghost" size="sm" onClick={handleSimReset} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                    تست مجدد
                  </Button>
                )}
              </div>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span>یک گزینه را انتخاب کنید تا عملکرد تشخیصی سیستم را مشاهده کنید:</span>
                  </div>
                  <div className="font-semibold text-sm leading-relaxed text-foreground">
                    <MathText text="جسمی به جرم $2\text{ kg}$ روی سطح شیب‌دار با زاویه $30^\circ$ در حال حرکت است. اگر $\mu_k = 0.2$ باشد، نیروی اصطکاک چند نیوتون است؟ ($g = 10, \cos 30^\circ \approx 0.86$)" />
                  </div>
                </div>

                {/* 4 Interactive Option Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'A', text: '$f_k = 2\\text{ N}$', hint: 'اشتباه (فرض زاویه $90^\\circ$)' },
                    { id: 'B', text: '$f_k = 3.44\\text{ N}$', hint: 'پاسخ صحیح ($f_k = \\mu_k mg\\cos\\theta$)' },
                    { id: 'C', text: '$f_k = 17.2\\text{ N}$', hint: 'اشتباه (فراموشی ضرب در $\\mu$)' },
                    { id: 'D', text: '$f_k = 10\\text{ N}$', hint: 'اشتباه (محاسبه مؤلفه سینوسی)' },
                  ].map((item) => {
                    const isSelected = simSelectedOption === item.id
                    const isCorrect = item.id === 'B'
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSimChoice(item.id as any)}
                        className={cn(
                          'p-3 rounded-lg border text-right transition-all text-xs font-medium cursor-pointer',
                          !simSubmitted && 'border-border/80 bg-background/50 hover:border-primary/60 hover:bg-primary/5 text-foreground',
                          simSubmitted && isSelected && isCorrect && 'border-emerald-500/80 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold',
                          simSubmitted && isSelected && !isCorrect && 'border-red-500/80 bg-red-500/10 text-red-700 dark:text-red-400 font-bold',
                          simSubmitted && !isSelected && isCorrect && 'border-emerald-500/40 bg-emerald-500/5 text-foreground',
                          simSubmitted && !isSelected && !isCorrect && 'opacity-60 border-border bg-muted/20 text-muted-foreground',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary ml-1">{item.id}.</span>
                          <MathText text={item.text} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Simulation Result / Diagnosis Outcome */}
                {simSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-xl border p-4 text-xs space-y-2.5',
                      simSelectedOption === 'B'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-amber-500/10 border-amber-500/30',
                    )}
                  >
                    {simSelectedOption === 'B' ? (
                      <>
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>پاسخ کاملاً صحیح است! تسلط شما روی تجزیه نیرو ثبت شد.</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          سیستم سطح این مبحث را در نقشه تسلط شما به رنگ 🟢 سبز تغییر داد.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>تشخیص ضعف: عدم تسلط بر محاسبه نیروی عمودی سطح ($F_N = mg\cos\theta$)</span>
                        </div>
                        <div className="bg-background/80 rounded-lg p-2.5 border space-y-1.5 text-foreground">
                          <div className="font-bold flex items-center gap-1.5 text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>نسخه تجویزی خودکار صادر شد:</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            • تماشای ویدیوی ۴ دقیقه‌ای: «تحلیل نیروها در سطح شیب‌دار»
                            <br />
                            • شرکت در آزمونک ۳ سواله برای خروج از وضعیت ضعف
                          </p>
                        </div>
                      </>
                    )}

                    {/* Lead capture form */}
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>رزرو رایگان جلسه تعیین‌سطح و مشاوره حضوری در آموزشگاه:</span>
                      </div>
                      {leadSubmitted ? (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>درخواست شما ثبت شد. مشاورین آموزشگاه به زودی با شما تماس می‌گیرند.</span>
                        </div>
                      ) : (
                        <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="نام و نام خانوادگی"
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            required
                            className="h-8 text-xs bg-background/80"
                          />
                          <Input
                            placeholder="شماره موبایل (۰۹...)"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.target.value)}
                            required
                            className="h-8 text-xs bg-background/80 font-mono"
                            dir="ltr"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={leadSubmitting}
                            className="h-8 text-xs shrink-0 gap-1 shadow-xs"
                          >
                            {leadSubmitting ? '...' : 'رزرو جلسه رایگان'}
                          </Button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                )}

                {!simSubmitted && (
                  <div className="text-center text-[11px] text-muted-foreground pt-1">
                    👆 روی یکی از گزینه‌ها کلیک کنید تا عملکرد موتور نسخه را مشاهده کنید
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* 10-Day Camp Interactive Roadmap */}
      <section id="camp-roadmap" className="mx-auto max-w-6xl px-4 lg:px-6 py-16 border-t border-border/60">
        <Reveal className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs px-3 py-1">
            🚀 فرمول طلایی جمع‌بندی فیزیک کنکور
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black">
            نقشه راه اردوی فشرده <span className="gradient-text-primary">۱۰ روزه</span> فیزیک کنکور
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            ۳ روز پایه دهم + ۳ روز پایه یازدهم + ۴ روز پایه دوازدهم.
            هر روز شامل میکروآموزش‌های کلیدی، آزمونک تستی و رفع ۱۰۰٪ ضعف‌ها با هوش مصنوعی.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEN_DAY_CAMP.map((c) => (
            <Reveal key={c.day}>
              <Card className="glass-card card-interactive h-full p-4 space-y-3 border-primary/20 hover:border-primary/50 transition-all flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-bold px-2.5 py-0.5',
                        c.color === 'emerald' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
                        c.color === 'amber' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
                        c.color === 'purple' && 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
                      )}
                    >
                      روز {c.day} · پایه {c.grade}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">{c.videoDurationMin} دقیقه میکروویدیو</span>
                  </div>

                  <h3 className="font-bold text-sm leading-snug">{c.title}</h3>

                  <div className="space-y-1 pt-1">
                    {c.topics.map((t, idx) => (
                      <div key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">آزمونک {c.questionCount} سواله</span>
                  <span className="font-medium text-primary text-[10px]">{c.badge}</span>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center max-w-2xl mx-auto space-y-3">
          <h4 className="font-bold text-base">آماده شرکت در اردوی حضوری ۱۰ روزه هستید؟</h4>
          <p className="text-xs text-muted-foreground">
            ظرفیت هر دوره به دلیل نظارت دقیق هوش مصنوعی و رفع اشکال فردبه‌فرد محدود است.
          </p>
          <Button asChild className="gap-2 text-xs h-9 shadow-md">
            <a href="#simulator">
              تست رایگان و رزرو تعیین‌سطح
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* 3-Step Process */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 lg:px-6 py-16 border-t border-border/60">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            فلسفه آکادمی
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold">چرخه ۳ مرحله‌ای تا تسلط ۱۰۰٪ بر فیزیک</h2>
          <p className="text-muted-foreground text-sm">
            این چرخه تکرار می‌شود تا هیچ نقطه ضعفی در فیزیک کنکور به شب آزمون موکول نشود.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <Reveal key={s.title}>
              <Card className="glass-card card-interactive h-full p-6 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center', s.bg, s.color)}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    مرحله {s.step}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {s.badge}
                  </Badge>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comparison: Traditional vs AI Academy */}
      <section className="mx-auto max-w-6xl px-4 lg:px-6 py-16 border-t border-border/60">
        <Reveal className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs px-3 py-1">
            ⚡ تفاوت ما با آموزشگاه‌های معمولی
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black">
            چرا رتبه ساختن با <span className="gradient-text-primary">هوش مصنوعی</span> اتفاق می‌افتد؟
          </h2>
          <p className="text-muted-foreground text-sm">
            مقایسه روش‌های سنتی کنکور با سیستم تشخیص و درمان هوشمند آکادمی فیزیک
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Traditional Cram School */}
          <Reveal>
            <Card className="p-6 space-y-4 border-red-500/20 bg-red-500/5 h-full rounded-2xl">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>روش سنتی سایر آموزشگاه‌ها</span>
              </div>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>تماشای ده‌ها ساعت فیلم ضبط‌شده بدون اینکه معلوم باشد مشکل کجاست</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>کارنامه فقط یک عدد کلی درصد می‌دهد و دلیل اشتباه مخفی می‌ماند</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>تست‌های غلط تا شب کنکور بدون رفع اشکال انباشته می‌شوند</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>والدین تا روز کنکور هیچ اطلاعی از وضعیت واقعی یادگیری ندارند</span>
                </li>
              </ul>
            </Card>
          </Reveal>

          {/* Our AI Academy */}
          <Reveal>
            <Card className="p-6 space-y-4 border-emerald-500/30 bg-emerald-500/5 h-full shadow-lg relative overflow-hidden rounded-2xl">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>آکادمی فیزیک مبتنی بر هوش مصنوعی</span>
              </div>
              <ul className="space-y-3 text-xs text-foreground font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>اردوی فشرده ۱۰ روزه:</strong> بودجه‌بندی دقیق ۳ روز دهم، ۳ روز یازدهم، ۴ روز دوازدهم</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>تشخیص میلی‌متری ضعف:</strong> هوش مصنوعی ریشه دقیق هر تست غلط را مشخص می‌کند</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>نسخه درمانی ۴ دقیقه‌ای:</strong> تجویز میکروآموزش و آزمونک تک‌مبحثی تا تسلط سبز</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>کارنامه مستقیم پیامکی به والدین:</strong> بدون نیاز به لاگین با تحلیل پیشرفت هفتگی</span>
                </li>
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Interactive Role Switcher */}
      <section className="bg-muted/30 py-16 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 space-y-10">
          <Reveal className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
              یک پلتفرم برای ۴ گروه ذینفع
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">چرا همه اعضای آموزشگاه از آن سود می‌برند؟</h2>
          </Reveal>

          {/* Role Navigation Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {ROLES_DATA.map((r, idx) => {
              const active = selectedRole === idx
              const Icon = r.icon
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(idx)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card hover:bg-card/80 border text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{r.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Role Content Card */}
          <Reveal>
            <Card className="glass-card max-w-3xl mx-auto p-6 sm:p-8 border-primary/20 shadow-lg">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <currentRoleData.icon className="h-4 w-4" />
                    <span>مخصوص {currentRoleData.label}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold">{currentRoleData.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentRoleData.desc}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {currentRoleData.points.map((pt, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border bg-background/60 p-3 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href="/login">
                      ورود به عنوان {currentRoleData.label}
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 lg:px-6 py-16 lg:py-20 space-y-12">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            امکانات پلتفرم
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold">ابزارهای پیشرفته تسلط بر فیزیک کنکور</h2>
          <p className="text-muted-foreground text-sm">
            تمام ابزارهای مورد نیاز برای تبدیل نمرات متوسط به رتبه‌های برتر کنکور
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title}>
                <Card className="glass-card card-interactive h-full p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {f.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
                </Card>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* High-Converting CTA Banner */}
      <section className="mx-auto max-w-5xl px-4 lg:px-6 pb-20">
        <Reveal>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary via-teal-700 to-slate-900 text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                آماده‌اید فیزیک کنکور را متحول کنید؟
              </h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                سامانه به صورت کامل آماده بهره‌برداری و دمو برای دانش‌آموزان و دبیران است.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg" variant="secondary" className="h-12 px-8 font-bold text-sm shadow-md">
                <Link href="/login">
                  ورود فوری به پنل دمو
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">آکادمی تخصصی فیزیک کنکور</span>
          </div>
          <div>پلتفرم هوشمند تشخیص ضعف و مسیر تسلط بر فیزیک کنکور</div>
        </div>
      </footer>
    </div>
  )
}

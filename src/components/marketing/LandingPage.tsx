'use client'

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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const STEPS = [
  {
    icon: Target,
    title: 'تشخیص',
    body: 'هر پاسخ غلط در آزمون تحلیل می‌شود تا ریشه واقعی ضعف — نه فقط سؤال اشتباه — مشخص شود.',
  },
  {
    icon: Sparkles,
    title: 'تجویز',
    body: 'بر اساس ریشه ضعف، درس مرتبط و آزمون جبرانی مخصوص همان دانش‌آموز ساخته می‌شود.',
  },
  {
    icon: Brain,
    title: 'تسلط',
    body: 'با آزمون مجدد و جعبه لایتنر، تسلط واقعی روی مبحث تثبیت و در نقشه پیشرفت ثبت می‌شود.',
  },
]

const FEATURES = [
  {
    icon: Bot,
    title: 'معلم هوشمند',
    body: 'دستیار فیزیک که با توجه به نقاط ضعف خود دانش‌آموز، مرحله‌به‌مرحله توضیح می‌دهد.',
  },
  {
    icon: Target,
    title: 'بانک سؤالات و آزمون',
    body: 'آزمون‌های استاندارد کنکور با تحلیل خودکار سطح دشواری و مبحث هر سؤال.',
  },
  {
    icon: BookOpen,
    title: 'کتابخانه ویدیو امن',
    body: 'ویدیوهای آموزشی با پخش امن و واترمارک هویتی — محافظت‌شده در برابر کپی و اشتراک‌گذاری.',
  },
  {
    icon: Brain,
    title: 'نقشه تسلط',
    body: 'نمای حرارتی از تمام مباحث فیزیک — دقیقاً می‌بینی کجا قوی و کجا نیاز به تمرین داری.',
  },
  {
    icon: BookMarked,
    title: 'دفتر اشتباهات',
    body: 'هر غلط به‌صورت خودکار ثبت می‌شود تا هیچ‌وقت یک اشتباه تکراری نشود.',
  },
  {
    icon: Sparkles,
    title: 'جعبه لایتنر',
    body: 'مرور زمان‌بندی‌شده مباحث ضعیف، دقیقاً در لحظه‌ای که مغز آماده فراموش کردن است.',
  },
]

const AUDIENCE = [
  {
    icon: GraduationCap,
    title: 'دانش‌آموز',
    body: 'مسیر شخصی‌سازی‌شده، آزمون و معلم هوشمند — همیشه در دسترس.',
  },
  {
    icon: Users,
    title: 'دبیر',
    body: 'داده واقعی از ضعف هر دانش‌آموز، پیش از رسیدن به کلاس حضوری.',
  },
  {
    icon: UserCog,
    title: 'مدیریت آموزشگاه',
    body: 'گزارش کامل پیشرفت و عملکرد هر دانش‌آموز در یک داشبورد.',
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Atom className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold">آموزشگاه فیزیک</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#features">ویژگی‌ها</a>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">ورود</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              مکمل کلاس‌های حضوری، نه جایگزین آن‌ها
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance">
              فیزیک کنکور را با مسیری که{' '}
              <span className="text-primary">ضعف واقعی تو</span> را می‌شناسد، تسلط کن
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              آموزشگاه فیزیک هر پاسخ غلط را تحلیل می‌کند، ریشه ضعف را پیدا می‌کند، درس و آزمون
              جبرانی مناسب همان ضعف را می‌سازد و مسیر رسیدن به تسلط را نشان می‌دهد.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  شروع کن
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">ببین چطور کار می‌کند</a>
              </Button>
            </div>
          </Reveal>

          <Reveal className="relative">
            <Card className="p-6 shadow-xl border-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">نقشه تسلط</div>
                    <div className="text-xs text-muted-foreground">مکانیک · دینامیک · نوسان</div>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const level = (i * 7 + 3) % 5
                    const shade =
                      level === 0
                        ? 'bg-primary/90'
                        : level === 1
                        ? 'bg-primary/60'
                        : level === 2
                        ? 'bg-primary/35'
                        : level === 3
                        ? 'bg-amber-400/50'
                        : 'bg-red-400/50'
                    return <div key={i} className={`aspect-square rounded-md ${shade}`} />
                  })}
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm">معلم هوشمند در حال آماده‌سازی درس جبرانی…</span>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 lg:px-6 py-16 lg:py-20">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">چطور کار می‌کند</h2>
          <p className="text-muted-foreground">
            یک چرخه ساده که با هر آزمون، دانش‌آموز را یک قدم به تسلط کامل نزدیک‌تر می‌کند.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.title}>
              <Card className="p-6 h-full space-y-3 hover-lift">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {i + 1}
                  </span>
                  مرحله {i + 1}
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 py-16 lg:py-20">
          <Reveal className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">همه ابزارهای تسلط، یک‌جا</h2>
            <p className="text-muted-foreground">
              هر بخش برای حل یک مشکل مشخص در مسیر آماده شدن برای کنکور فیزیک طراحی شده.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Reveal key={f.title}>
                <Card className="p-5 h-full space-y-3 hover-lift bg-card">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="mx-auto max-w-6xl px-4 lg:px-6 py-16 lg:py-20">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">برای کل آموزشگاه</h2>
          <p className="text-muted-foreground">هر نقش، داشبورد و ابزار مخصوص خودش را دارد.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {AUDIENCE.map((a) => (
            <Reveal key={a.title}>
              <div className="text-center space-y-3 p-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <a.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 lg:px-6 pb-16 lg:pb-24">
        <Reveal>
          <Card className="hero-gradient border-0 shadow-xl p-8 sm:p-12 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold">آماده‌ای مسیر تسلطت را ببینی؟</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              وارد حساب خودت شو و همین حالا ببین سیستم کجای فیزیک را ضعف تو تشخیص می‌دهد.
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href="/login">
                ورود به حساب
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-primary" />
            <span>آموزشگاه فیزیک — پلتفرم آموزشی هوشمند</span>
          </div>
          <span>© {new Date().getFullYear()} تمام حقوق محفوظ است.</span>
        </div>
      </footer>
    </div>
  )
}

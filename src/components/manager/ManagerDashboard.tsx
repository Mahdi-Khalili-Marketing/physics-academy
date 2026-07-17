'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  GraduationCap,
  FileText,
  Printer,
  Activity,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { toFa, toFaNumber, formatToman, relativeTime, faDate } from '@/lib/fa'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Dashboard = {
  stats: {
    totalStudents: number
    activeStudents: number
    engagedStudents: number
    engagementRate: number
    revenue: number
    paidSubscriptions: number
    earlyWarningsCount: number
  }
  earlyWarnings: {
    studentId: string
    name: string
    phone: string
    attempts: number
    avgScore: number | null
    lastActive: string | null
    reason: string
  }[]
  classSummaries: {
    id: string
    name: string
    teacherName: string
    studentCount: number
    avgScore: number
    recentAttempts: number
  }[]
  students: {
    id: string
    name: string
    grade: string
    _count: { examAttempts: number }
  }[]
}

export function ManagerDashboard({ view, onNavigate }: { view: string; onNavigate: (v: string) => void }) {
  if (view === 'students') return <StudentsList onBack={() => onNavigate('home')} />

  return <ManagerHome onNavigate={onNavigate} />
}

function ManagerHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manager/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6">
      <Card className="border-0 hero-gradient">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">داشبورد مدیریت</h1>
              <p className="text-muted-foreground mt-2">
                نگاهی یک‌مرتبه‌ای به وضعیت آموزشگاه — فروش، فعالیت دانش‌آموزان و هشدارهای زودهنگام.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => onNavigate('students')} variant="outline" className="gap-2">
                  <Users className="h-4 w-4" /> فهرست دانش‌آموزان
                </Button>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">درآمد کل (پرداخت یک‌باره)</div>
              <div className="text-3xl font-bold text-emerald-600">{formatToman(data.stats.revenue)}</div>
              <div className="text-xs text-muted-foreground">{toFa(data.stats.paidSubscriptions)} اشتراک فعال</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="کل دانش‌آموزان" value={toFa(data.stats.totalStudents)} sub={`${toFa(data.stats.activeStudents)} فعال`} icon={<Users className="h-4 w-4" />} accent="teal" />
        <StatCard title="دانش‌آموزان فعال در ۱۴ روز" value={toFa(data.stats.engagedStudents)} sub={`${toFaNumber(data.stats.engagementRate)}٪ مشارکت`} icon={<Activity className="h-4 w-4" />} accent="emerald" />
        <StatCard title="هشدارهای زودهنگام" value={toFa(data.stats.earlyWarningsCount)} sub="نیازمند پیگیری" icon={<AlertTriangle className="h-4 w-4" />} accent="amber" />
        <StatCard title="درآمد ثبت‌شده" value={formatToman(data.stats.revenue)} sub={`${toFa(data.stats.paidSubscriptions)} اشتراک`} icon={<DollarSign className="h-4 w-4" />} accent="purple" />
      </div>

      {/* Early warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            هشدار زودهنگام
          </CardTitle>
          <CardDescription>دانش‌آموزانی که نیاز به پیگیری فوری دارند — پیش از آنکه دیر شود</CardDescription>
        </CardHeader>
        <CardContent>
          {data.earlyWarnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              همه دانش‌آموزان فعال هستند.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.earlyWarnings.map((w) => (
                <ReportCardTrigger key={w.studentId} studentId={w.studentId} studentName={w.name}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer">
                    <Avatar className="h-8 w-8 bg-amber-500/30">
                      <AvatarFallback className="text-amber-700 text-xs">{w.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{w.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{w.phone}</div>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700">{w.reason}</Badge>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {w.lastActive ? `آخرین فعالیت: ${relativeTime(new Date(w.lastActive))}` : 'بدون فعالیت'}
                      </div>
                    </div>
                  </div>
                </ReportCardTrigger>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            خلاصه کلاس‌ها
          </CardTitle>
          <CardDescription>وضعیت هر کلاس و میانگین نمره</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.classSummaries.map((c) => (
              <Card key={c.id} className="hover-lift">
                <CardContent className="p-4">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">دبیر: {c.teacherName}</div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-muted-foreground">{toFa(c.studentCount)} دانش‌آموز</span>
                    <span className={cn('font-bold', c.avgScore >= 14 ? 'text-emerald-600' : c.avgScore >= 10 ? 'text-amber-600' : 'text-red-600')}>
                      میانگین: {toFaNumber(c.avgScore)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Students list ============
function StudentsList({ onBack }: { onBack: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manager/students')
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فهرست دانش‌آموزان</h1>
          <p className="text-muted-foreground text-sm mt-1">{toFa(students.length)} دانش‌آموز ثبت‌نام‌شده</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="text-right p-3">نام</th>
                  <th className="text-right p-3 hidden sm:table-cell">موبایل</th>
                  <th className="text-right p-3 hidden md:table-cell">والدین</th>
                  <th className="text-right p-3">آزمون</th>
                  <th className="text-right p-3 hidden sm:table-cell">ویدیو</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8" style={{ backgroundColor: s.avatarColor }}>
                          <AvatarFallback className="text-white text-xs">{s.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {s.referralCode ? `کد معرفی: ${s.referralCode}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell" dir="ltr">{s.phone}</td>
                    <td className="p-3 hidden md:table-cell" dir="ltr">{s.parentPhone || '—'}</td>
                    <td className="p-3">{toFa(s.attempts)}</td>
                    <td className="p-3 hidden sm:table-cell">{toFa(s.videoViews)}</td>
                    <td className="p-3">
                      {s.isActive ? (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10">فعال</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-700 bg-red-500/10">غیرفعال</Badge>
                      )}
                    </td>
                    <td className="p-3 text-left">
                      <ReportCardTrigger studentId={s.id} studentName={s.name}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-3 w-3" /> کارنامه
                        </Button>
                      </ReportCardTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Report card modal ============
function ReportCardTrigger({ studentId, studentName, children }: { studentId: string; studentName: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadCard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/report-card/${studentId}`)
      const d = await res.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v && !data) loadCard()
      }}
    >
      <DialogTrigger asChild>
        <div onClick={() => setOpen(true)}>{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>کارنامه {studentName}</span>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
              <Printer className="h-3 w-3" /> چاپ
            </Button>
          </DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">میانگین کلی</div>
                <div className="text-2xl font-bold text-teal-600">{toFaNumber(data.avgOverall)}</div>
                <div className="text-[10px] text-muted-foreground">از ۲۰</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">تعداد آزمون</div>
                <div className="text-2xl font-bold">{toFa(data.attempts.length)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">اشتباهات باز</div>
                <div className="text-2xl font-bold text-amber-600">{toFa(data.errors)}</div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {data.summary}
            </div>

            <div>
              <div className="text-sm font-bold mb-2">نقشه تسلط فصول</div>
              <div className="space-y-1">
                {data.mastery.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'inline-block h-3 w-3 rounded-full',
                        m.level === 'green' ? 'bg-emerald-500'
                        : m.level === 'yellow' ? 'bg-amber-500'
                        : m.level === 'red' ? 'bg-red-500'
                        : 'bg-muted border border-dashed',
                      )}
                    />
                    <span className="flex-1">{m.title}</span>
                    {m.avg !== null && <span className="text-muted-foreground">{toFaNumber(m.avg)} · {toFa(m.attempts)} آزمون</span>}
                  </div>
                ))}
              </div>
            </div>

            {data.attempts.length > 0 && (
              <div>
                <div className="text-sm font-bold mb-2">آزمون‌های اخیر</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {data.attempts.slice(-8).reverse().map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded border text-xs">
                      <span className="truncate flex-1">{a.examTitle}</span>
                      <span className="text-muted-foreground mx-2">{faDate(new Date(a.finishedAt))}</span>
                      <span className={cn('font-bold', a.score >= 14 ? 'text-emerald-600' : a.score >= 10 ? 'text-amber-600' : 'text-red-600')}>
                        {toFaNumber(a.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
              تاریخ صدور: {faDate(new Date(data.generatedAt))} · آموزشگاه فیزیک
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

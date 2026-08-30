'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ExternalLink,
  MessageSquare,
  Sparkles,
  Upload,
  CheckCircle2,
  PhoneCall,
  Server,
  RefreshCcw,
  Send,
  UserPlus,
  Key,
} from 'lucide-react'
import Link from 'next/link'
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
  if (view === 'students') return <StudentsList onNavigate={onNavigate} />
  if (view === 'leads') return <MarketingLeadsPanel onNavigate={onNavigate} />
  if (view === 'observability') return <ObservabilityPanel onNavigate={onNavigate} />

  return <ManagerHome onNavigate={onNavigate} />
}

// ============================ HOME VIEW ============================
function ManagerHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingBulkSms, setSendingBulkSms] = useState(false)

  useEffect(() => {
    fetch('/api/manager/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  async function handleSendBulkSms() {
    setSendingBulkSms(true)
    try {
      const res = await fetch('/api/manager/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`پیامک کارنامه با موفقیت برای ${toFa(result.sent)} ولی ارسال شد.`)
      } else {
        toast.error(result.error || 'خطا در ارسال پیامک')
      }
    } catch {
      toast.error('خطای ارتباط با سامانه پیامک')
    } finally {
      setSendingBulkSms(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-2xl" />

  if (!data || !data.stats || !data.classSummaries) {
    return (
      <div className="p-8 text-center space-y-3 bg-card border rounded-2xl">
        <div className="text-sm text-muted-foreground">در حال آماده‌سازی اطلاعات پنل مدیریت...</div>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>تلاش مجدد</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 hero-gradient">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">مرکز فرماندهی آکادمی فیزیک</h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed">
                مدیریت دانش‌آموزان حضوری، ارسال گزارش کارنامه پیامکی به اولیاء و رهگیری خطاهای سیستم با OpenObserve.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button onClick={() => onNavigate('students')} variant="default" className="gap-2 text-xs">
                  <Upload className="h-4 w-4" /> ثبت و ایمپورت اکسل دانش‌آموزان
                </Button>
                <Button onClick={() => onNavigate('leads')} variant="outline" className="gap-2 text-xs">
                  <Sparkles className="h-4 w-4" /> لیدهای هوش مصنوعی
                </Button>
                <Button
                  onClick={handleSendBulkSms}
                  disabled={sendingBulkSms}
                  variant="outline"
                  className="gap-2 text-xs border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                >
                  <Send className="h-4 w-4" />
                  {sendingBulkSms ? 'در حال ارسال...' : 'ارسال پیامک کارنامه به همه اولیاء'}
                </Button>
              </div>
            </div>
            <div className="text-center md:text-right bg-background/80 backdrop-blur border rounded-2xl p-4 shadow-xs">
              <div className="text-xs text-muted-foreground font-medium">دانش‌آموزان ثبت‌نام‌شده</div>
              <div className="text-4xl font-black text-primary stat-num">{toFa(data.stats.totalStudents)}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">{toFa(data.stats.activeStudents)} دانش‌آموز فعال</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="کل دانش‌آموزان حضوری" value={toFa(data.stats.totalStudents)} sub={`${toFa(data.stats.activeStudents)} فعال در سیستم`} icon={<Users className="h-4 w-4" />} accent="teal" />
        <StatCard title="مشارکت در آزمونک‌ها" value={toFa(data.stats.engagedStudents)} sub={`${toFaNumber(data.stats.engagementRate)}٪ مشارکت ۱۴ روزه`} icon={<Activity className="h-4 w-4" />} accent="emerald" />
        <StatCard title="هشدارهای زودهنگام ضعف" value={toFa(data.stats.earlyWarningsCount)} sub="نیازمند تماس مشاور" icon={<AlertTriangle className="h-4 w-4" />} accent="amber" />
        <StatCard title="سیستم پایش و لاگینگ" value="OpenObserve" sub="استریم فعال لاگ‌ها" icon={<Server className="h-4 w-4" />} accent="purple" />
      </div>

      {/* Early warnings */}
      <Card className="border-amber-500/30">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              هشدارهای زودهنگام افت تحصیلی
            </CardTitle>
            <CardDescription className="text-xs">
              دانش‌آموزانی با عدم فعالیت یا نمره ضعیف که نیازمند پیگیری تلفنی با اولیاء هستند
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
            {toFa(data.earlyWarnings.length)} مورد
          </Badge>
        </CardHeader>
        <CardContent>
          {data.earlyWarnings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              هیچ دانش‌آموزی در وضعیت هشدار نیست. همه در مسیر مناسبی هستند! 🎉
            </div>
          ) : (
            <div className="divide-y">
              {data.earlyWarnings.map((w) => (
                <div key={w.studentId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span>{w.name}</span>
                      <span className="text-xs text-muted-foreground font-normal" dir="ltr">{w.phone}</span>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠️ {w.reason}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {w.attempts > 0 ? (
                        <>میانگین نمره: <strong className="text-foreground">{toFaNumber(w.avgScore, 1)}</strong> · آخرین فعالیت: {relativeTime(w.lastActive)}</>
                      ) : (
                        'هنوز در هیچ آزمونی شرکت نکرده است'
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs h-8">
                      <Link href={`/p/${w.studentId}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 ml-1" /> گزارش ولی
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================ STUDENTS & EXCEL IMPORT ============================
function StudentsList({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)

  // Manual Single Student State
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualParentPhone, setManualParentPhone] = useState('')
  const [manualSpotLicense, setManualSpotLicense] = useState('')
  const [manualGrade, setManualGrade] = useState<'GRADE_12_PHYSICS' | 'GRADE_11_PHYSICS'>('GRADE_12_PHYSICS')
  const [manualSendSms, setManualSendSms] = useState(true)
  const [manualCreating, setManualCreating] = useState(false)

  // Edit License Modal State
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [editLicenseValue, setEditLicenseValue] = useState('')
  const [updatingLicense, setUpdatingLicense] = useState(false)

  function loadStudents() {
    setLoading(true)
    fetch('/api/manager/students')
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStudents()
  }, [])

  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!manualName.trim() || !manualPhone.trim()) {
      toast.error('نام و شماره موبایل دانش‌آموز الزامی است.')
      return
    }
    setManualCreating(true)
    try {
      const res = await fetch('/api/manager/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          phone: manualPhone.trim(),
          parentPhone: manualParentPhone.trim() || undefined,
          spotPlayerLicense: manualSpotLicense.trim() || undefined,
          grade: manualGrade,
          sendWelcomeSms: manualSendSms,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'دانش‌آموز با موفقیت ثبت شد.')
        setManualOpen(false)
        setManualName('')
        setManualPhone('')
        setManualParentPhone('')
        setManualSpotLicense('')
        loadStudents()
      } else {
        toast.error(data.error || 'خطا در ثبت دانش‌آموز')
      }
    } catch {
      toast.error('خطای ارتباط با سرور')
    } finally {
      setManualCreating(false)
    }
  }

  async function handleSaveLicense(e: React.FormEvent) {
    e.preventDefault()
    if (!editingStudent) return
    setUpdatingLicense(true)
    try {
      const res = await fetch('/api/manager/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editingStudent.id,
          spotPlayerLicense: editLicenseValue.trim() || null,
        }),
      })
      if (res.ok) {
        toast.success(`لایسنس اسپات‌پلیر برای ${editingStudent.name} ذخیره شد.`)
        setEditingStudent(null)
        loadStudents()
      } else {
        toast.error('خطا در ذخیره لایسنس')
      }
    } catch {
      toast.error('خطای ارتباط با سرور')
    } finally {
      setUpdatingLicense(false)
    }
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault()
    if (!csvText.trim()) {
      toast.error('متن یا فایل CSV را وارد کنید.')
      return
    }
    setImporting(true)
    try {
      const res = await fetch('/api/manager/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, sendWelcomeSms: true }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${toFa(data.count)} دانش‌آموز با موفقیت ثبت شدند و پیامک خوش‌آمد ارسال شد.`)
        setImportOpen(false)
        setCsvText('')
        loadStudents()
      } else {
        toast.error(data.error || 'خطا در ایمپورت')
      }
    } catch {
      toast.error('خطای ارتباط با سرور')
    } finally {
      setImporting(false)
    }
  }

  async function sendSingleSms(studentId: string, name: string) {
    try {
      const res = await fetch('/api/manager/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(`پیامک کارنامه برای اولیاء ${name} ارسال شد.`)
      } else {
        toast.error(d.error || 'خطا در ارسال پیامک')
      }
    } catch {
      toast.error('خطا در ارسال پیامک')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            دانش‌آموزان حضوری آکادمی
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            فهرست دانش‌آموزان ثبت‌نام‌شده، افزودن تکی/دستی و ارسال مستقیم پیامک به اولیاء.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Single Student Dialog */}
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-xs">
                <UserPlus className="h-4 w-4" /> افزودن دستی دانش‌آموز
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  ثبت نام حضوری دانش‌آموز جدید
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">نام و نام خانوادگی دانش‌آموز *</Label>
                  <Input
                    placeholder="مثال: آرمین صادقی"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">شماره موبایل دانش‌آموز *</Label>
                  <Input
                    placeholder="09121234567"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    required
                    dir="ltr"
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">شماره موبایل ولی (جهت کارنامه پیامکی)</Label>
                  <Input
                    placeholder="09129876543"
                    value={manualParentPhone}
                    onChange={(e) => setManualParentPhone(e.target.value)}
                    dir="ltr"
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center justify-between">
                    <span>کد لایسنس اسپات‌پلیر (اختیاری)</span>
                    <span className="text-[10px] text-primary font-mono">SpotPlayer</span>
                  </Label>
                  <Input
                    placeholder="کلید لایسنس از پنل اسپات‌پلیر..."
                    value={manualSpotLicense}
                    onChange={(e) => setManualSpotLicense(e.target.value)}
                    dir="ltr"
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">پایه تحصیلی</Label>
                  <select
                    value={manualGrade}
                    onChange={(e) => setManualGrade(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                  >
                    <option value="GRADE_12_PHYSICS">پایه دوازدهم (کنکور سراسری)</option>
                    <option value="GRADE_11_PHYSICS">پایه یازدهم</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="manualSendSms"
                    checked={manualSendSms}
                    onChange={(e) => setManualSendSms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="manualSendSms" className="text-xs font-normal cursor-pointer">
                    ارسال خودکار پیامک خوش‌آمدگویی و اطلاعات ورود (رمز: 1234)
                  </Label>
                </div>

                <Button type="submit" disabled={manualCreating} className="w-full gap-2 text-xs">
                  <UserPlus className="h-4 w-4" />
                  {manualCreating ? 'در حال ثبت نام...' : 'ثبت قطعی دانش‌آموز و ایجاد اکانت'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Bulk CSV Importer Dialog */}
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-xs">
                <Upload className="h-4 w-4" /> ورود گروهی از اکسل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">ورود دسته‌ای دانش‌آموزان (Excel / CSV)</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBulkImport} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    لیست اسامی و شماره‌ها را از فایل اکسل کپی کرده و اینجا Paste کنید (فرمت: نام، شماره دانش‌آموز، شماره ولی):
                  </Label>
                  <Textarea
                    dir="ltr"
                    rows={8}
                    placeholder={`علی رضایی, 09121111111, 09122222222\nسارا محمدی, 09123333333, 09124444444`}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground bg-muted p-2.5 rounded-lg leading-relaxed">
                  💡 رمز عبور پیش‌فرض تمام دانش‌آموزان <code>1234</code> تنظیم می‌شود و پیامک اطلاعات ورود به طور خودکار ارسال خواهد شد.
                </div>
                <Button type="submit" disabled={importing} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  {importing ? 'در حال ثبت و صدور حساب‌ها...' : 'ثبت قطعی دانش‌آموزان و ارسال پیامک'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">دانش‌آموزی ثبت نشده است.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">دانش‌آموز</th>
                    <th className="p-3">موبایل</th>
                    <th className="p-3">موبایل ولی</th>
                    <th className="p-3">لایسنس اسپات‌پلیر</th>
                    <th className="p-3">تعداد آزمونک</th>
                    <th className="p-3">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Avatar className="h-7 w-7" style={{ backgroundColor: s.avatarColor || '#0ea5a4' }}>
                          <AvatarFallback className="text-white text-xs">{(s?.name || '').slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{s.name}</span>
                      </td>
                      <td className="p-3 font-mono text-xs" dir="ltr">{s.phone}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground" dir="ltr">{s.parentPhone || '—'}</td>
                      <td className="p-3 text-xs">
                        {s.spotPlayerLicense ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded max-w-[120px] truncate" dir="ltr">
                              {s.spotPlayerLicense}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingStudent(s)
                                setEditLicenseValue(s.spotPlayerLicense || '')
                              }}
                            >
                              ✏️
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] h-6 px-2 text-muted-foreground border border-dashed border-border hover:text-primary hover:border-primary"
                            onClick={() => {
                              setEditingStudent(s)
                              setEditLicenseValue('')
                            }}
                          >
                            ➕ ثبت لایسنس
                          </Button>
                        )}
                      </td>
                      <td className="p-3 text-xs">{toFa(s.attempts)} آزمون</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendSingleSms(s.id, s.name)}
                            className="text-xs h-7 gap-1"
                          >
                            <Send className="h-3 w-3" /> پیامک کارنامه
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="text-xs h-7">
                            <Link href={`/p/${s.id}`} target="_blank">
                              <ExternalLink className="h-3 w-3" /> گزارش
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit SpotPlayer License Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              تنظیم لایسنس اسپات‌پلیر برای {editingStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLicense} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">کد لایسنس SpotPlayer</Label>
              <Input
                placeholder="کلید لایسنس دریافتی از پنل اسپات‌پلیر را وارد کنید..."
                value={editLicenseValue}
                onChange={(e) => setEditLicenseValue(e.target.value)}
                dir="ltr"
                className="text-xs h-9 font-mono"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                این لایسنس بلافاصله در پنل دانش‌آموز نمایش داده می‌شود و می‌تواند ویدیوهای تجویزی را با آن تماشا کند.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingStudent(null)} className="text-xs h-8">
                انصراف
              </Button>
              <Button type="submit" disabled={updatingLicense} className="text-xs h-8">
                {updatingLicense ? 'در حال ذخیره...' : 'ذخیره لایسنس'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================ MARKETING LEADS PANEL ============================
function MarketingLeadsPanel({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  function loadLeads() {
    setLoading(true)
    fetch('/api/marketing/leads')
      .then((r) => (r.ok ? r.json() : { leads: [] }))
      .then((d) => setLeads(d.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLeads()
  }, [])

  async function updateStatus(id: string, status: string) {
    await fetch('/api/marketing/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    toast.success('وضعیت لید به‌روزرسانی شد')
    loadLeads()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          لیدهای جذب‌شده از هوش مصنوعی (Landing Leads)
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          دانش‌آموزانی که در لندینگ‌پیج تست تشخیصی داده‌اند و شماره تماس برای تعیین‌سطح حضوری ثبت کرده‌اند.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-48" /></div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              هنوز لید جدیدی از صفحه اول ثبت نشده است. با ورود بازدیدکنندگان و انجام تست آنلاین، شماره‌ها اینجا نمایش می‌یابند.
            </div>
          ) : (
            <div className="divide-y">
              {leads.map((l) => (
                <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{l.name}</span>
                      <Badge variant="outline" className="text-xs font-mono" dir="ltr">{l.phone}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{l.grade}</Badge>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      🩺 ضعف شناسایی‌شده با AI: <strong>{l.weakTopicTitle}</strong> (دقت: {toFa(l.accuracyPct)}٪)
                    </div>
                    <div className="text-[11px] text-muted-foreground">ثبت درخواست: {relativeTime(l.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={l.status === 'CALLED' ? 'secondary' : 'outline'}
                      onClick={() => updateStatus(l.id, 'CALLED')}
                      className="text-xs h-8 gap-1"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> تماس گرفته شد
                    </Button>
                    <Button
                      size="sm"
                      variant={l.status === 'ENROLLED' ? 'default' : 'outline'}
                      onClick={() => updateStatus(l.id, 'ENROLLED')}
                      className={cn('text-xs h-8 gap-1', l.status === 'ENROLLED' && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> ثبت‌نام حضوری شد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================ OBSERVABILITY PANEL ============================
function ObservabilityPanel({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  async function runHealthCheck() {
    setTesting(true)
    try {
      const res = await fetch('/api/system/observability/test', { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
      if (data.success) {
        toast.success('پالس مانیتورینگ با موفقیت به استریم OpenObserve ارسال شد.')
      } else {
        toast.error(data.error || 'خطا در ارسال پالس')
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          مرکز پایش و مانیتورینگ OpenObserve
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          رهگیری بلادرنگ خطاها، لاگ‌های هوش مصنوعی، پاسخ‌های سیستم و استریم‌های OpenObserve.
        </p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            وضعیت لاگینگ و تله‌متری پلتفرم
          </CardTitle>
          <CardDescription className="text-xs">
            پایش هوشمند درخواست‌ها، مدت پاسخ‌دهی مدل جمینای و خطاهای دانش‌آموزان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="text-xs text-muted-foreground font-medium">وضعیت اتصال OpenObserve</div>
              <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>فعال و آماده دریافت لاگ</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="text-xs text-muted-foreground font-medium">استریم اختصاصی پلتفرم</div>
              <div className="text-sm font-bold font-mono">physics_academy_logs</div>
            </div>
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="text-xs text-muted-foreground font-medium">موتور ذخیره‌سازی</div>
              <div className="text-sm font-bold">OpenObserve Rust Core</div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button onClick={runHealthCheck} disabled={testing} className="gap-2 text-xs">
              <RefreshCcw className="h-4 w-4" />
              {testing ? 'در حال ارسال تست لاگ...' : 'ارسال لاگ تستی به OpenObserve'}
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-3 rounded-xl bg-muted text-xs font-mono dir-ltr">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

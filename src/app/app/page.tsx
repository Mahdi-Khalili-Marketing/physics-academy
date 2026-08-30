'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Target,
  BookOpen,
  BookMarked,
  Sparkles,
  Brain,
  Bot,
  Users,
  FileText,
  PlusCircle,
  ClipboardList,
  LogIn,
  Activity,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AppShell, NavItem } from '@/components/shared/AppShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { AiTutor } from '@/components/student/AiTutor'
import { ExamList, ExamRunner } from '@/components/exam/ExamRunner'
import { VideoLibrary } from '@/components/video/VideoLibrary'
import { ErrorNotebook } from '@/components/student/ErrorNotebook'
import { LeitnerBox } from '@/components/student/LeitnerBox'
import { MasteryMap } from '@/components/student/MasteryMap'
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard'
import { ManagerDashboard } from '@/components/manager/ManagerDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AppHome() {
  const router = useRouter()
  const { user, loading, fetchMe } = useAppStore()
  const [view, setView] = useState('home')
  const [examId, setExamId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="space-y-4 w-full max-w-md text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center p-6 border-primary/20 shadow-lg">
          <CardContent className="space-y-4 pt-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">ورود به حساب کاربری</h2>
            <p className="text-sm text-muted-foreground">
              برای مشاهده داشبورد، لطفاً ابتدا وارد حساب کاربری خود شوید.
            </p>
            <Button asChild className="w-full gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" /> رفتن به صفحه ورود
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============ STUDENT ============
  if (user.role === 'STUDENT') {
    const nav: NavItem[] = [
      { id: 'home', label: 'داشبورد', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'exams', label: 'آزمون‌ها', icon: <Target className="h-4 w-4" /> },
      { id: 'tutor', label: 'معلم هوشمند', icon: <Bot className="h-4 w-4" /> },
      { id: 'library', label: 'کتابخانه ویدیو', icon: <BookOpen className="h-4 w-4" /> },
      { id: 'mastery', label: 'نقشه تسلط', icon: <Brain className="h-4 w-4" /> },
      { id: 'errors', label: 'دفتر اشتباهات', icon: <BookMarked className="h-4 w-4" /> },
      { id: 'leitner', label: 'جعبه لایتنر', icon: <Sparkles className="h-4 w-4" /> },
    ]

    function handleNavigate(id: string) {
      setView(id)
      setExamId(null)
      setVideoId(undefined)
    }

    return (
      <AppShell nav={nav} activeId={view} onNavigate={handleNavigate}>
        {view === 'home' && (
          <StudentDashboard
            onOpenExam={(id) => {
              if (id) {
                setExamId(id)
                setView('exam-runner')
              } else {
                setView('exams')
              }
            }}
            onOpenLibrary={() => setView('library')}
            onOpenVideo={(vid) => {
              setVideoId(vid)
              setView('library')
            }}
          />
        )}
        {view === 'exams' && (
          <ExamList
            onOpen={(id) => {
              setExamId(id)
              setView('exam-runner')
            }}
            onBack={() => setView('home')}
          />
        )}
        {view === 'exam-runner' && examId && (
          <ExamRunner
            key={examId}
            examId={examId}
            onExit={() => {
              setExamId(null)
              setView('exams')
            }}
            onViewLibrary={(vid) => {
              setVideoId(vid)
              setView('library')
            }}
            onOpenExam={(id) => setExamId(id)}
          />
        )}
        {view === 'library' && (
          <VideoLibrary
            initialVideoId={videoId}
            onBack={() => setView('home')}
          />
        )}
        {view === 'tutor' && <AiTutor onBack={() => setView('home')} />}
        {view === 'mastery' && <MasteryMap onBack={() => setView('home')} />}
        {view === 'errors' && <ErrorNotebook onBack={() => setView('home')} />}
        {view === 'leitner' && <LeitnerBox onBack={() => setView('home')} />}
      </AppShell>
    )
  }

  // ============ TEACHER ============
  if (user.role === 'TEACHER') {
    const nav: NavItem[] = [
      { id: 'home', label: 'داشبورد دبیر', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'questions', label: 'بانک سؤالات', icon: <ClipboardList className="h-4 w-4" /> },
      { id: 'add-question', label: 'افزودن سؤال', icon: <PlusCircle className="h-4 w-4" /> },
    ]

    return (
      <AppShell nav={nav} activeId={view} onNavigate={setView}>
        <TeacherDashboard view={view} onNavigate={setView} />
      </AppShell>
    )
  }

  // ============ MANAGER ============
  if (user.role === 'MANAGER') {
    const nav: NavItem[] = [
      { id: 'home', label: 'داشبورد مدیریت', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'students', label: 'دانش‌آموزان و ایمپورت', icon: <Users className="h-4 w-4" /> },
      { id: 'leads', label: 'لیدهای هوش مصنوعی', icon: <Sparkles className="h-4 w-4" /> },
      { id: 'observability', label: 'پایش و OpenObserve', icon: <Activity className="h-4 w-4" /> },
    ]

    return (
      <AppShell nav={nav} activeId={view} onNavigate={setView}>
        <ManagerDashboard view={view} onNavigate={setView} />
      </AppShell>
    )
  }

  return null
}

'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Target,
  BookOpen,
  BookMarked,
  Sparkles,
  Brain,
  Users,
  FileText,
  PlusCircle,
  ClipboardList,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AppShell, NavItem } from '@/components/shared/AppShell'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { ExamList, ExamRunner } from '@/components/exam/ExamRunner'
import { VideoLibrary } from '@/components/video/VideoLibrary'
import { ErrorNotebook } from '@/components/student/ErrorNotebook'
import { LeitnerBox } from '@/components/student/LeitnerBox'
import { MasteryMap } from '@/components/student/MasteryMap'
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard'
import { ManagerDashboard } from '@/components/manager/ManagerDashboard'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user, loading, fetchMe } = useAppStore()
  const [view, setView] = useState('home')
  const [examId, setExamId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-96" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  // ============ STUDENT ============
  if (user.role === 'STUDENT') {
    const nav: NavItem[] = [
      { id: 'home', label: 'داشبورد', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'exams', label: 'آزمون‌ها', icon: <Target className="h-4 w-4" /> },
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
          />
        )}
        {view === 'exams' && (
          <ExamList
            onOpen={(id) => { setExamId(id); setView('exam-runner') }}
            onBack={() => setView('home')}
          />
        )}
        {view === 'exam-runner' && examId && (
          <ExamRunner
            examId={examId}
            onExit={() => { setExamId(null); setView('exams') }}
            onViewLibrary={(vid) => { setVideoId(vid); setView('library') }}
          />
        )}
        {view === 'library' && (
          <VideoLibrary
            initialVideoId={videoId}
            onBack={() => setView('home')}
          />
        )}
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
      { id: 'students', label: 'دانش‌آموزان', icon: <Users className="h-4 w-4" /> },
      { id: 'reports', label: 'گزارش‌ها', icon: <FileText className="h-4 w-4" /> },
    ]

    // For now reports view → just show student list (since report cards are modal)
    if (view === 'reports') {
      return (
        <AppShell nav={nav} activeId="reports" onNavigate={setView}>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">گزارش‌ها</h1>
            <p className="text-muted-foreground">برای مشاهده کارنامه هر دانش‌آموز، از فهرست دانش‌آموزان استفاده کنید.</p>
            <button onClick={() => setView('students')} className="text-teal-600 underline">رفتن به فهرست دانش‌آموزان ←</button>
          </div>
        </AppShell>
      )
    }

    return (
      <AppShell nav={nav} activeId={view} onNavigate={setView}>
        <ManagerDashboard view={view} onNavigate={setView} />
      </AppShell>
    )
  }

  return null
}

'use client'

import { useState, ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Atom, LogOut, Moon, Sun, MoreHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export type NavItem = {
  id: string
  label: string
  icon: ReactNode
  badge?: number | string
}

export function AppShell({
  nav,
  activeId,
  onNavigate,
  children,
}: {
  nav: NavItem[]
  activeId: string
  onNavigate: (id: string) => void
  children: ReactNode
}) {
  const { user, logout, switchRole } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const initials = (user.name || 'مدیر').slice(0, 2)

  // Bottom bar holds at most 5 tabs; extras go to the "more" sheet
  const barNav = nav.length <= 5 ? nav : nav.slice(0, 4)
  const overflowNav = nav.length <= 5 ? [] : nav.slice(4)

  async function handleLogout() {
    await logout()
    toast('خروج موفقیت‌آمیز بود')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 flex items-center justify-center shadow-xs">
              <Atom className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm lg:text-base leading-none tracking-tight flex items-center gap-1.5">
                <span>آکادمی تخصصی فیزیک</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">AI</span>
              </div>
              <div className="hidden sm:block text-[11px] text-muted-foreground mt-1">پلتفرم هوشمند تشخیص و نسخه کنکور</div>
            </div>
          </div>

          <div className="mr-auto flex items-center gap-2">
            {(user.role === 'TEACHER' || user.role === 'MANAGER') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextRole = user.role === 'TEACHER' ? 'MANAGER' : 'TEACHER'
                  switchRole(nextRole)
                  toast.info(`تغییر به پنل ${nextRole === 'TEACHER' ? 'دبیر فیزیک' : 'مدیریت آموزشگاه'}`)
                }}
                className="h-8 px-2.5 text-xs gap-1.5 border-primary/35 bg-primary/8 text-primary hover:bg-primary/15 transition-all shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>حالت: <strong>{user.role === 'TEACHER' ? 'دبیر فیزیک' : 'مدیریت'}</strong></span>
                <span className="text-[10px] text-muted-foreground mr-0.5">⇄ سوئیچ</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="تغییر تم"
              className="h-9 w-9 rounded-xl hover:bg-muted/80"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pr-2 pl-3 h-9 rounded-xl hover:bg-muted/80">
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20" style={{ backgroundColor: user.avatarColor || '#0ea5e9' }}>
                    <AvatarFallback className="text-white text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs font-bold">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-bold">{user.name}</span>
                    <span className="text-xs text-muted-foreground font-normal" dir="ltr">{user.phone}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground" disabled>
                  نقش: {user.role === 'STUDENT' ? '🎓 دانش‌آموز' : user.role === 'TEACHER' ? '👨‍🏫 دبیر فیزیک' : '🏫 مدیر آموزشگاه'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 cursor-pointer">
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-64 flex-col border-l bg-muted/20 backdrop-blur-xs p-3 sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="space-y-1.5">
            {nav.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === activeId}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </nav>
          <div className="mt-auto p-3 text-[11px] text-muted-foreground border-t pt-3 flex items-center justify-between">
            <span>آکادمی فیزیک کنکور</span>
            <span className="text-[10px] text-primary font-mono font-semibold">v2.0 AI</span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 pb-24 lg:p-6">
          <div className="page-enter mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile "more" sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-16 inset-x-0 bg-background border-t rounded-t-2xl shadow-xl p-3 bottom-nav">
            <nav className="space-y-1">
              {overflowNav.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  onClick={() => {
                    onNavigate(item.id)
                    setMobileOpen(false)
                  }}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur bottom-nav"
        aria-label="ناوبری اصلی"
      >
        <div className="flex items-stretch justify-around">
          {barNav.map((item) => (
            <TabButton
              key={item.id}
              item={item}
              active={item.id === activeId}
              onClick={() => {
                onNavigate(item.id)
                setMobileOpen(false)
              }}
            />
          ))}
          {overflowNav.length > 0 && (
            <TabButton
              item={{ id: '__more', label: 'بیشتر', icon: <MoreHorizontal className="h-5 w-5" /> }}
              active={mobileOpen || overflowNav.some((i) => i.id === activeId)}
              onClick={() => setMobileOpen((v) => !v)}
            />
          )}
        </div>
      </nav>
    </div>
  )
}

function TabButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex-1 flex flex-col items-center justify-center gap-1 min-h-14 py-2 text-[11px] font-medium press-scale',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
      <span className="relative">
        {item.icon}
        {item.badge ? (
          <span className="absolute -top-1.5 -left-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] leading-4 text-center">
            {item.badge}
          </span>
        ) : null}
      </span>
      {item.label}
    </button>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl px-3 min-h-11 text-xs font-semibold transition-all press-scale relative',
        active
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs font-bold'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent',
      )}
    >
      <div className={cn('shrink-0 transition-transform', active && 'scale-110 text-primary')}>{item.icon}</div>
      <span className="flex-1 text-right">{item.label}</span>
      {item.badge ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">{item.badge}</span>
      ) : null}
      {active && <span className="absolute right-1 top-2.5 bottom-2.5 w-1 rounded-full bg-primary" />}
    </button>
  )
}

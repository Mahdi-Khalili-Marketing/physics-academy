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
import { Atom, LogOut, Moon, Sun, Menu, X } from 'lucide-react'
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
  const { user, logout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const initials = user.name.slice(0, 2)

  async function handleLogout() {
    await logout()
    toast('خروج موفقیت‌آمیز بود')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="منو"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <Atom className="h-5 w-5 text-teal-600" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold leading-none">آموزشگاه فیزیک</div>
              <div className="text-xs text-muted-foreground mt-1">پلتفرم آموزشی هوشمند</div>
            </div>
          </div>

          <div className="mr-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="تغییر تم"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pr-2 pl-3">
                  <Avatar className="h-8 w-8" style={{ backgroundColor: user.avatarColor }}>
                    <AvatarFallback className="text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground font-normal" dir="ltr">{user.phone}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground" disabled>
                  نقش: {user.role === 'STUDENT' ? 'دانش‌آموز' : user.role === 'TEACHER' ? 'دبیر' : 'مدیر'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
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
        <aside className="hidden lg:flex w-64 flex-col border-l bg-muted/30 p-3 sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="space-y-1">
            {nav.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === activeId}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </nav>
          <div className="mt-auto p-3 text-xs text-muted-foreground border-t pt-3">
            نسخه دمو · فاز ۱ پلتفرم
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute right-0 top-16 bottom-0 w-72 bg-background border-l shadow-xl p-3 overflow-y-auto">
              <nav className="space-y-1">
                {nav.map((item) => (
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
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="page-enter mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {item.icon}
      <span className="flex-1 text-right">{item.label}</span>
      {item.badge ? (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">{item.badge}</span>
      ) : null}
    </button>
  )
}

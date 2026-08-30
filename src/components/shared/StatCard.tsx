'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  title: string
  value: ReactNode
  icon?: ReactNode
  sub?: string
  accent?: 'teal' | 'amber' | 'red' | 'emerald' | 'purple' | 'default'
  className?: string
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  teal: 'border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent hover:border-cyan-500/45',
  amber: 'border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover:border-amber-500/45',
  red: 'border-red-500/25 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent hover:border-red-500/45',
  emerald: 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/45',
  purple: 'border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent hover:border-purple-500/45',
  default: 'hover:border-primary/40',
}

const iconChipClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  teal: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 shadow-xs',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25 shadow-xs',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs',
  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-xs',
  default: 'bg-muted text-muted-foreground border border-border/50',
}

export function StatCard({ title, value, icon, sub, accent = 'default', className }: StatCardProps) {
  return (
    <Card className={cn('glass-card card-interactive relative overflow-hidden', accentClasses[accent], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-xs font-semibold text-muted-foreground">{title}</CardTitle>
        {icon ? (
          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', iconChipClasses[accent])}>
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl sm:text-3xl font-black stat-num text-foreground tracking-tight">{value}</div>
        {sub ? <p className="mt-1 text-[11px] text-muted-foreground leading-tight font-medium">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

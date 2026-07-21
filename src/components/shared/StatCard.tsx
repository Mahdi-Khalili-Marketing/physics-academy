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
  teal: 'border-teal-500/30 bg-teal-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  red: 'border-red-500/30 bg-red-500/5',
  emerald: 'border-emerald-500/30 bg-emerald-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
  default: '',
}

const iconChipClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  default: 'bg-muted text-muted-foreground',
}

export function StatCard({ title, value, icon, sub, accent = 'default', className }: StatCardProps) {
  return (
    <Card className={cn('hover-lift', accentClasses[accent], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ? (
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconChipClasses[accent])}>
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold stat-num">{value}</div>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

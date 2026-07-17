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

export function StatCard({ title, value, icon, sub, accent = 'default', className }: StatCardProps) {
  return (
    <Card className={cn('hover-lift', accentClasses[accent], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

'use client'

import { cn } from '@/lib/utils'

type Props = {
  level: 'green' | 'yellow' | 'red' | 'none'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const colors = {
  green: 'bg-emerald-500 text-emerald-50',
  yellow: 'bg-amber-500 text-amber-50',
  red: 'bg-red-500 text-red-50',
  none: 'bg-muted text-muted-foreground border border-dashed',
}

const sizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

export function MasteryDot({ level, label, size = 'md', pulse = false, className }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-block rounded-full',
          colors[level],
          sizes[size],
          level === 'red' && pulse && 'cell-red',
          className,
        )}
        aria-label={label || level}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  )
}

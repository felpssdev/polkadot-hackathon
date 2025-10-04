'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        'group relative flex flex-col items-center gap-2 py-3.5 px-2',
        'rounded-xl bg-white/[0.03]',
        'hover:bg-white/[0.06] active:scale-[0.97]',
        'transition-all duration-200',
        'border-2 border-white/[0.08]',
        'scanlines',
      )}
      onClick={onClick}
    >
      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors border border-primary/20">
        <Icon className="size-8 text-primary" strokeWidth={2.5} />
      </div>
      <span className="text-[7px] font-pixel text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  )
}

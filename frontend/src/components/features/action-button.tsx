'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        'flex flex-col items-center gap-3 h-auto py-6 px-8 pixelated',
        'hover:bg-primary/20 hover:border-primary transition-all',
      )}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border-2 border-primary/50">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </Button>
  )
}

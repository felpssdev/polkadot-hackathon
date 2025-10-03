'use client'

import { ArrowLeft, HelpCircle } from 'lucide-react'

interface LimitsHeaderProps {
  onBack: () => void
}

export function LimitsHeader({ onBack }: LimitsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3.5 bg-background/90 backdrop-blur-xl border-b-2 border-primary/20">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg bg-white/5 border-2 border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-white/90" strokeWidth={2.5} />
        </button>
        <h1 className="text-[15px] font-pixel font-bold tracking-tight text-white">
          Meus Limites
        </h1>
      </div>
      <button className="w-9 h-9 rounded-lg bg-white/5 border-2 border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
        <HelpCircle className="h-4 w-4 text-white/90" strokeWidth={2.5} />
      </button>
    </header>
  )
}

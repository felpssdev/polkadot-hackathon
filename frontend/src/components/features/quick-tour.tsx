'use client'

import { Sparkles } from 'lucide-react'

export function QuickTour() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-4 cursor-pointer hover:from-primary/25 hover:via-primary/15 hover:to-secondary/25 transition-all duration-300 border-2 border-primary/30 group scanlines">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/20 pixel-blink">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[12px] font-pixel font-bold text-white mb-1">
              Instalar App
            </h3>
            <p className="text-[9px] text-muted-foreground font-medium">
              Experiência completa
            </p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-[10px] font-pixel font-bold hover:bg-white/15 active:scale-95 transition-all">
          Instalar
        </button>
      </div>
    </div>
  )
}

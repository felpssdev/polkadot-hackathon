'use client'

import { ArrowDownToLine, ArrowUpFromLine, ScanLine } from 'lucide-react'

export function BottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-2xl border-t-2 border-primary/20 px-5 py-4 safe-area-inset-bottom">
      <div className="flex items-center justify-between max-w-md mx-auto gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white text-[11px] font-pixel font-bold hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg shadow-primary/30 border-2 border-primary/50 btn-8bit">
          <ArrowDownToLine className="h-[16px] w-[16px]" strokeWidth={3} />
          Comprar
        </button>

        <button className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 flex items-center justify-center hover:from-primary/30 hover:to-secondary/30 transition-all backdrop-blur-sm cursor-pointer shadow-lg pixel-blink">
          <ScanLine className="h-6 w-6 text-primary" strokeWidth={2.5} />
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black text-[11px] font-pixel font-bold hover:bg-white/90 transition-all shadow-lg border-2 border-white/30 btn-8bit">
          <ArrowUpFromLine className="h-[16px] w-[16px]" strokeWidth={3} />
          Vender
        </button>
      </div>
    </div>
  )
}

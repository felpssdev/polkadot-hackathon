'use client'

import { Menu, Download } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'

export function Header() {
  return (
    <header className="flex items-center justify-between px-2 py-2 border-b-4 border-primary">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="pixelated">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center pixelated">
            <span className="text-sm font-bold">P</span>
          </div>
          <h1 className="text-sm font-bold tracking-wider">DOT/BRL Withdraw</h1>
        </div>
      </div>
      <Button variant="outline" size="icon" className="pixelated">
        <Download className="h-5 w-5" />
      </Button>
    </header>
  )
}

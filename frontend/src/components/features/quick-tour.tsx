'use client'

import { Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/8bit/card'

export function QuickTour() {
  return (
    <Card className="pixelated mx-6 bg-gradient-to-br from-primary/40 to-secondary/40 border-primary/50 overflow-hidden">
      <CardContent className="relative p-8">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
        <div className="relative flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-wide">Quick App Tour</h3>
          <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center border-4 border-primary pixelated">
            <Play className="h-8 w-8 text-primary fill-primary ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

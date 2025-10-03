'use client'

import { Button } from '@/components/ui/8bit/button'
import { ArrowDownToLine, ArrowUpFromLine, QrCode } from 'lucide-react'

export function BottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t-4 border-primary px-6 py-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <Button className="flex-1 pixelated text-base py-6" size="lg">
          <ArrowDownToLine className="h-5 w-5 mr-2" />
          Buy USDC
        </Button>

        <div className="mx-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary pixelated hover:bg-primary/30 transition-colors cursor-pointer">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xs mt-2 font-medium">Scan & Pay</span>
        </div>

        <Button
          variant="outline"
          className="flex-1 pixelated text-base py-6"
          size="lg"
        >
          <ArrowUpFromLine className="h-5 w-5 mr-2" />
          Sell USDC
        </Button>
      </div>
    </div>
  )
}

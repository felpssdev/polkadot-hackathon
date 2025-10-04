'use client'

import { Menu, Download, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()

  const handleDisconnect = () => {
    // Clear wallet connection data
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('selectedCurrency')
    localStorage.removeItem('selectedLanguage')

    // Redirect to wallet login
    router.push('/wallet')
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3.5 bg-background/90 backdrop-blur-xl border-b-2 border-primary/20">
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-lg bg-white/5 border-2 border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
          <Menu className="h-4 w-4 text-white/90" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/20 pixel-blink">
            <span className="text-[10px] font-pixel font-bold text-white">
              P
            </span>
          </div>
          <h1 className="text-[13px] font-pixel font-bold tracking-tight text-white">
            PolkaPay
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-lg bg-white/5 border-2 border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
          <Download className="h-4 w-4 text-white/90" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleDisconnect}
          className="w-9 h-9 rounded-lg bg-white/5 border-2 border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 transition-all"
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4 text-white/90" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  )
}

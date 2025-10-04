import type { Metadata } from 'next'
import { Inter, Press_Start_2P as PressStart2P } from 'next/font/google'
import './globals.css'
import { WalletAuth } from '@/components/auth/wallet-auth'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const pixelFont = PressStart2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'PolkaPay - Polkadot to BRL',
  description: 'Revolutionizing Polkadot payments via PIX',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${pixelFont.variable} font-sans antialiased`}
      >
        <WalletAuth>{children}</WalletAuth>
      </body>
    </html>
  )
}

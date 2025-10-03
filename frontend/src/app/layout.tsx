import type { Metadata } from 'next'
import { Press_Start_2P as PressStart2P } from 'next/font/google'
import './globals.css'

const pixelFont = PressStart2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'P2P.ME - 8bit Wallet',
  description: 'Polkadot Hackathon - Latin Hack',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${pixelFont.variable} font-pixel antialiased`}>
        {children}
      </body>
    </html>
  )
}

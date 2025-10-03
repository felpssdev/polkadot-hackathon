import type { Metadata } from 'next'
import { Inter, Press_Start_2P as PressStart2P } from 'next/font/google'
import './globals.css'

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
  title: 'P2P.ME - Polkadot to BRL',
  description: 'Revolucionando pagamentos Polkadot via PIX',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} ${pixelFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

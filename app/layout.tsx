import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DMA Vision — KWANDA',
  description: 'Sistema de Gestão de Manutenção e Peças',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-PT">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { AppProvider } from '@/lib/AppContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Terra | Terrenos D / W',
  description: 'Acompanhamento de recebimentos e saldo corrigido dos terrenos D e W.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

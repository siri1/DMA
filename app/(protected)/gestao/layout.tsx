'use client'

import { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Gestão" icon={TrendingUp} accent="from-emerald-700 to-emerald-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

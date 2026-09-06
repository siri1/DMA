'use client'

import { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { DMA_VISION_NAV } from '@/components/layout/nav-config'

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="DMA Vision" icon={TrendingUp} accent="from-emerald-700 to-emerald-900" navGroups={DMA_VISION_NAV} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

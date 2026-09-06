'use client'

import { ReactNode } from 'react'
import { Wrench } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { DMA_VISION_NAV } from '@/components/layout/nav-config'

export default function OficinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="DMA Vision" icon={Wrench} accent="from-blue-700 to-blue-900" navGroups={DMA_VISION_NAV} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

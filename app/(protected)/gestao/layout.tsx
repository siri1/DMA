'use client'

import { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DMA_VISION_NAV } from '@/components/layout/nav-config'

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="DMA Vision" icon={TrendingUp} accent="from-emerald-700 to-emerald-900" navGroups={DMA_VISION_NAV}>
      {children}
    </AppShell>
  )
}

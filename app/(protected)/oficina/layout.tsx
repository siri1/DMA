'use client'

import { ReactNode } from 'react'
import { Wrench } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DMA_VISION_NAV } from '@/components/layout/nav-config'

export default function OficinLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="DMA Vision" icon={Wrench} accent="from-blue-700 to-blue-900" navGroups={DMA_VISION_NAV}>
      {children}
    </AppShell>
  )
}

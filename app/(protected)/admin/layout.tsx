'use client'

import { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DMA_VISION_NAV } from '@/components/layout/nav-config'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="DMA Vision" icon={Settings} accent="from-slate-700 to-slate-900" navGroups={DMA_VISION_NAV}>
      {children}
    </AppShell>
  )
}

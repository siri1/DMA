'use client'

import { ReactNode } from 'react'
import { Warehouse } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PECAS_NAV } from '@/components/layout/nav-config'

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Módulo de Peças" icon={Warehouse} accent="from-amber-700 to-amber-900" navGroups={PECAS_NAV}>
      {children}
    </AppShell>
  )
}

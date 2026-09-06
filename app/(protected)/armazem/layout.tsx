'use client'

import { ReactNode } from 'react'
import { Warehouse } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { PECAS_NAV } from '@/components/layout/nav-config'

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Módulo de Peças" icon={Warehouse} accent="from-amber-700 to-amber-900" navGroups={PECAS_NAV} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

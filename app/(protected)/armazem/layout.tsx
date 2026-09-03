'use client'

import { ReactNode } from 'react'
import { Warehouse } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Armazém de Peças" icon={Warehouse} accent="from-amber-700 to-amber-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

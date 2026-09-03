'use client'

import { ReactNode } from 'react'
import { Wrench, ClipboardList, CalendarClock, PackageSearch, AlertTriangle } from 'lucide-react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/oficina/assets', label: 'Equipamentos', icon: Wrench },
  { href: '/oficina/workorders', label: 'Ordens de Trabalho', icon: ClipboardList },
  { href: '/oficina/maintenance-plans', label: 'Planos de Manutenção', icon: CalendarClock },
  { href: '/oficina/requisitions', label: 'Requisições', icon: PackageSearch },
  { href: '/oficina/quarantine', label: 'Quarentena', icon: AlertTriangle },
]

export default function OficinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Oficina DMA" icon={Wrench} items={items} accent="from-blue-700 to-blue-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

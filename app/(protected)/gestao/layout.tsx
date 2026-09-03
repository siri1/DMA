'use client'

import { ReactNode } from 'react'
import { TrendingUp, BarChart3, Search, Users } from 'lucide-react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', icon: BarChart3 },
  { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', icon: TrendingUp },
  { href: '/admin/audit', label: 'Auditoria', icon: Search },
  { href: '/admin/users', label: 'Utilizadores', icon: Users },
]

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Gestão" icon={TrendingUp} items={items} accent="from-emerald-700 to-emerald-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

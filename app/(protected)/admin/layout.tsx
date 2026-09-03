'use client'

import { ReactNode } from 'react'
import { Settings, Users, Search, BarChart3, TrendingUp } from 'lucide-react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/admin/users', label: 'Utilizadores', icon: Users },
  { href: '/admin/audit', label: 'Auditoria', icon: Search },
  { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', icon: BarChart3 },
  { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', icon: TrendingUp },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Administração" icon={Settings} items={items} accent="from-slate-700 to-slate-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

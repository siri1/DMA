import { ReactNode } from 'react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', emoji: '📊' },
  { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', emoji: '📈' },
  { href: '/admin/audit', label: 'Auditoria', emoji: '🔍' },
  { href: '/admin/users', label: 'Utilizadores', emoji: '👥' },
]

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Gestão" emoji="📈" items={items} accent="from-emerald-700 to-emerald-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

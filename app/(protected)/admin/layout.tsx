import { ReactNode } from 'react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/admin/users', label: 'Utilizadores', emoji: '👥' },
  { href: '/admin/audit', label: 'Auditoria', emoji: '🔍' },
  { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', emoji: '📊' },
  { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', emoji: '📈' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Administração" emoji="⚙️" items={items} accent="from-slate-700 to-slate-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

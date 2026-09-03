import { ReactNode } from 'react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/oficina/assets', label: 'Equipamentos', emoji: '🚜' },
  { href: '/oficina/workorders', label: 'Ordens de Trabalho', emoji: '🛠️' },
  { href: '/oficina/maintenance-plans', label: 'Planos de Manutenção', emoji: '🗓️' },
  { href: '/oficina/requisitions', label: 'Requisições', emoji: '📋' },
  { href: '/oficina/quarantine', label: 'Quarentena', emoji: '⚠️' },
]

export default function OficinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Oficina DMA" emoji="🔧" items={items} accent="from-blue-700 to-blue-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

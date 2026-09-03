import { ReactNode } from 'react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/armazem/inventory', label: 'Stocks e Artigos', emoji: '📦' },
  { href: '/armazem/receipts', label: 'Recepção', emoji: '🚚' },
  { href: '/armazem/purchases', label: 'Compras e Fornecedores', emoji: '🧾' },
  { href: '/armazem/counts', label: 'Inventário e Localizações', emoji: '📍' },
  { href: '/oficina/requisitions', label: 'Requisições', emoji: '📋' },
]

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Armazém de Peças" emoji="🏭" items={items} accent="from-amber-700 to-amber-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

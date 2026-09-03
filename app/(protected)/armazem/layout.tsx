'use client'

import { ReactNode } from 'react'
import { Warehouse, Package, Truck, Receipt, MapPin, PackageSearch } from 'lucide-react'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'

const items: NavItem[] = [
  { href: '/armazem/inventory', label: 'Stocks e Artigos', icon: Package },
  { href: '/armazem/receipts', label: 'Recepção', icon: Truck },
  { href: '/armazem/purchases', label: 'Compras e Fornecedores', icon: Receipt },
  { href: '/armazem/counts', label: 'Inventário e Localizações', icon: MapPin },
  { href: '/oficina/requisitions', label: 'Requisições', icon: PackageSearch },
]

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Armazém de Peças" icon={Warehouse} items={items} accent="from-amber-700 to-amber-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

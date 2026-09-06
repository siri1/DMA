import type { LucideIcon } from 'lucide-react'
import {
  Wrench,
  ClipboardList,
  CalendarClock,
  AlertTriangle,
  PackageSearch,
  Package,
  Truck,
  Receipt,
  MapPin,
  BarChart3,
  TrendingUp,
  Search,
  Users,
  CalendarDays,
} from 'lucide-react'
import type { Permission } from '@/lib/rbac'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** RBAC module name gating visibility of this item */
  module: string
  /** Permission required to see the item (defaults to 'view') */
  permission?: Permission
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

/**
 * DMA Vision and Módulo de Peças are walled off from each other: each
 * renders its own nav list, with no group in one ever linking into the
 * other's pages. Moving between them happens only through the Hub
 * ("Trocar de Módulo"), never via a sidebar item. Dashboards and
 * Administração live inside the DMA Vision nav rather than getting a
 * third Hub card, since there's no dedicated management module today.
 *
 * Item-level visibility is still filtered per-viewer by RBAC in
 * Sidebar.tsx, same as before - the wall is about which LIST a layout
 * passes in, not a second permission system.
 */
export const DMA_VISION_NAV: NavGroup[] = [
  {
    label: 'Oficina',
    icon: Wrench,
    items: [
      { href: '/oficina/assets', label: 'Equipamentos', icon: Wrench, module: 'assets' },
      { href: '/oficina/workorders', label: 'Ordens de Trabalho', icon: ClipboardList, module: 'workorders' },
      { href: '/oficina/schedule', label: 'Escala Diária', icon: CalendarDays, module: 'workorders' },
      { href: '/oficina/maintenance-plans', label: 'Planos de Manutenção', icon: CalendarClock, module: 'maintenance' },
      { href: '/oficina/quarantine', label: 'Quarentena', icon: AlertTriangle, module: 'assets' },
      { href: '/oficina/requisitions', label: 'As Minhas Requisições', icon: PackageSearch, module: 'requisitions' },
    ],
  },
  {
    label: 'Gestão',
    icon: TrendingUp,
    items: [
      { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', icon: BarChart3, module: 'workorders' },
      { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', icon: TrendingUp, module: 'workorders' },
      { href: '/gestao/technician-workload', label: 'Carga dos Técnicos', icon: Users, module: 'interventions' },
    ],
  },
  {
    label: 'Administração',
    icon: Users,
    items: [
      { href: '/admin/users', label: 'Utilizadores', icon: Users, module: 'users' },
      { href: '/admin/audit', label: 'Auditoria', icon: Search, module: 'audit' },
    ],
  },
]

export const PECAS_NAV: NavGroup[] = [
  {
    label: 'Peças',
    icon: Package,
    items: [
      { href: '/armazem/inventory', label: 'Stocks e Artigos', icon: Package, module: 'items' },
      { href: '/armazem/receipts', label: 'Recepção', icon: Truck, module: 'stocks' },
      { href: '/armazem/purchases', label: 'Compras e Fornecedores', icon: Receipt, module: 'suppliers' },
      { href: '/armazem/counts', label: 'Inventário e Localizações', icon: MapPin, module: 'stocks' },
      { href: '/armazem/requisitions', label: 'Requisições de Manutenção', icon: PackageSearch, module: 'requisitions' },
    ],
  },
]

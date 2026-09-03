import type { LucideIcon } from 'lucide-react'
import {
  Wrench,
  ClipboardList,
  CalendarClock,
  AlertTriangle,
  Package,
  PackageSearch,
  Truck,
  Receipt,
  MapPin,
  BarChart3,
  TrendingUp,
  Search,
  Users,
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
 * Single source of truth for the app's navigation. Every protected layout
 * renders the same set of groups; visibility of each item (and of a whole
 * group, once empty) is filtered per-viewer by their role's RBAC
 * permissions in Sidebar.tsx — so every role sees every module they can
 * actually use, including Peças (parts/warehouse), instead of a hand-picked
 * subset per role.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Oficina',
    icon: Wrench,
    items: [
      { href: '/oficina/assets', label: 'Equipamentos', icon: Wrench, module: 'assets' },
      { href: '/oficina/workorders', label: 'Ordens de Trabalho', icon: ClipboardList, module: 'workorders' },
      { href: '/oficina/maintenance-plans', label: 'Planos de Manutenção', icon: CalendarClock, module: 'maintenance' },
      { href: '/oficina/quarantine', label: 'Quarentena', icon: AlertTriangle, module: 'assets' },
    ],
  },
  {
    label: 'Peças',
    icon: Package,
    items: [
      { href: '/armazem/inventory', label: 'Stocks e Artigos', icon: Package, module: 'items' },
      { href: '/oficina/requisitions', label: 'Requisições', icon: PackageSearch, module: 'requisitions' },
      { href: '/armazem/receipts', label: 'Recepção', icon: Truck, module: 'stocks' },
      { href: '/armazem/purchases', label: 'Compras e Fornecedores', icon: Receipt, module: 'suppliers' },
      { href: '/armazem/counts', label: 'Inventário e Localizações', icon: MapPin, module: 'stocks' },
    ],
  },
  {
    label: 'Gestão',
    icon: TrendingUp,
    items: [
      { href: '/gestao/dashboard-exec', label: 'Dashboard Executivo', icon: BarChart3, module: 'workorders' },
      { href: '/gestao/dashboard-ops', label: 'Dashboard Operacional', icon: TrendingUp, module: 'workorders' },
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

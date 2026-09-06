import type { UserRole } from '@prisma/client'
import { Wrench, Package, type LucideIcon } from 'lucide-react'

export type ModuleId = 'dma_vision' | 'modulo_pecas'

export interface ModuleInfo {
  id: ModuleId
  name: string
  description: string
  icon: LucideIcon
  accent: string
}

export const MODULES: Record<ModuleId, ModuleInfo> = {
  dma_vision: {
    id: 'dma_vision',
    name: 'DMA Vision',
    description: 'Equipamentos, ordens de trabalho, planos de manutenção e quarentena.',
    icon: Wrench,
    accent: 'from-blue-700 to-blue-900',
  },
  modulo_pecas: {
    id: 'modulo_pecas',
    name: 'Módulo de Peças',
    description: 'Stocks, requisições, recepção, compras e fornecedores.',
    icon: Package,
    accent: 'from-amber-700 to-amber-900',
  },
}

/**
 * Which top-level modules each existing role sees in the Hub. This is a
 * deliberately separate, coarser decision from lib/rbac.ts's per-action
 * permission matrix (e.g. OFICINA has 'items:view' to browse the catalog
 * when requisitioning, but that alone shouldn't grant them the full Peças
 * module in the hub - inventory/receipts/purchases stay Armazém's home).
 * Uses the project's real UserRole enum - no new roles introduced.
 */
export const MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  ADMIN: ['dma_vision', 'modulo_pecas'],
  GESTAO: ['dma_vision', 'modulo_pecas'],
  OFICINA: ['dma_vision'],
  ARMAZEM: ['modulo_pecas'],
  CLIENTE_INTERNO: ['dma_vision'],
  PAINEL: [], // never sees the hub - always goes straight to /painel
}

/** Where a module lands a given role - CLIENTE_INTERNO can't view the
 * work-order dashboard (see lib/rbac.ts), so it gets the read-only
 * equipment list instead. */
export function getModuleEntryPath(moduleId: ModuleId, role: UserRole): string {
  if (moduleId === 'dma_vision') {
    return role === 'CLIENTE_INTERNO' ? '/oficina/assets' : '/gestao/dashboard-ops'
  }
  return '/armazem/inventory'
}

export function getModulesForRole(role: UserRole): ModuleInfo[] {
  return MODULE_ACCESS[role].map((id) => MODULES[id])
}

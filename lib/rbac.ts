import { UserRole } from '@prisma/client'

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'admin'

type PermissionMatrix = Record<string, Record<Permission, UserRole[]>>

export const PERMISSIONS: PermissionMatrix = {
  assets: {
    view: ['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO', 'CLIENTE_INTERNO', 'PAINEL'],
    create: ['ADMIN', 'OFICINA', 'GESTAO'],
    edit: ['ADMIN', 'OFICINA', 'GESTAO'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  workorders: {
    view: ['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO', 'PAINEL'],
    create: ['ADMIN', 'OFICINA', 'GESTAO'],
    edit: ['ADMIN', 'OFICINA', 'GESTAO'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  interventions: {
    view: ['ADMIN', 'OFICINA', 'GESTAO'],
    create: ['ADMIN', 'OFICINA'],
    edit: ['ADMIN', 'OFICINA'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  maintenance: {
    view: ['ADMIN', 'OFICINA', 'GESTAO', 'CLIENTE_INTERNO'],
    create: ['ADMIN', 'OFICINA', 'GESTAO'],
    edit: ['ADMIN', 'OFICINA', 'GESTAO'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  items: {
    view: ['ADMIN', 'ARMAZEM', 'OFICINA', 'GESTAO', 'CLIENTE_INTERNO'],
    create: ['ADMIN', 'ARMAZEM'],
    edit: ['ADMIN', 'ARMAZEM'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
    admin: ['ADMIN'],
  },
  stocks: {
    view: ['ADMIN', 'ARMAZEM', 'GESTAO'],
    create: ['ADMIN', 'ARMAZEM'],
    edit: ['ADMIN', 'ARMAZEM'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
    admin: ['ADMIN'],
  },
  requisitions: {
    view: ['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO'],
    create: ['ADMIN', 'OFICINA'],
    edit: ['ADMIN', 'OFICINA', 'ARMAZEM'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'ARMAZEM', 'GESTAO'],
    admin: ['ADMIN'],
  },
  users: {
    view: ['ADMIN'],
    create: ['ADMIN'],
    edit: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
    admin: ['ADMIN'],
  },
  audit: {
    view: ['ADMIN', 'GESTAO'],
    create: [],
    edit: [],
    delete: [],
    approve: [],
    admin: ['ADMIN'],
  },
  suppliers: {
    view: ['ADMIN', 'ARMAZEM', 'GESTAO'],
    create: ['ADMIN', 'ARMAZEM'],
    edit: ['ADMIN', 'ARMAZEM'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
  purchaseOrders: {
    view: ['ADMIN', 'ARMAZEM', 'GESTAO'],
    create: ['ADMIN', 'ARMAZEM'],
    edit: ['ADMIN', 'ARMAZEM'],
    delete: ['ADMIN'],
    approve: ['ADMIN', 'GESTAO'],
    admin: ['ADMIN'],
  },
}

export function hasPermission(
  role: UserRole,
  module: string,
  permission: Permission
): boolean {
  const modulePerms = PERMISSIONS[module]
  if (!modulePerms) return false
  return modulePerms[permission]?.includes(role) ?? false
}

export function canViewCosts(role: UserRole): boolean {
  return role !== 'CLIENTE_INTERNO'
}

export function canViewAudit(role: UserRole): boolean {
  return role !== 'CLIENTE_INTERNO'
}

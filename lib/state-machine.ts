import type { UserRole } from '@prisma/client'
import { prisma } from './prisma'

export interface StateTransition {
  fromState: string
  toState: string
  allowedRoles: UserRole[]
  reasonRequired: boolean
  sideEffects?: (entityId: string, userId: string) => Promise<void>
}

// Asset state machine
export const ASSET_TRANSITIONS: Record<string, StateTransition[]> = {
  EM_OPERACAO: [
    {
      fromState: 'EM_OPERACAO',
      toState: 'EM_MANUTENCAO',
      allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_OPERACAO',
      toState: 'FORA_DE_SERVICO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  EM_MANUTENCAO: [
    {
      fromState: 'EM_MANUTENCAO',
      toState: 'EM_OPERACAO',
      allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_MANUTENCAO',
      toState: 'INDISPONIVEL',
      allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  INDISPONIVEL: [
    {
      fromState: 'INDISPONIVEL',
      toState: 'EM_OPERACAO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
    {
      fromState: 'INDISPONIVEL',
      toState: 'FORA_DE_SERVICO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  FORA_DE_SERVICO: [
    {
      fromState: 'FORA_DE_SERVICO',
      toState: 'QUARENTENA',
      allowedRoles: ['ADMIN', 'OFICINA', 'GESTAO'],
      reasonRequired: false,
    },
    {
      fromState: 'FORA_DE_SERVICO',
      toState: 'EM_OPERACAO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  QUARENTENA: [
    {
      fromState: 'QUARENTENA',
      toState: 'EM_OPERACAO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
    {
      fromState: 'QUARENTENA',
      toState: 'ABATIDO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  ABATIDO: [],
}

// WorkOrder state machine
export const WORKORDER_TRANSITIONS: Record<string, StateTransition[]> = {
  ABERTA: [
    {
      fromState: 'ABERTA',
      toState: 'EM_CURSO',
      allowedRoles: ['ADMIN', 'OFICINA'],
      reasonRequired: false,
    },
    {
      fromState: 'ABERTA',
      toState: 'CANCELADA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
    {
      fromState: 'ABERTA',
      toState: 'PENDENTE',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  EM_CURSO: [
    {
      fromState: 'EM_CURSO',
      toState: 'EM_DIAGNOSTICO',
      allowedRoles: ['ADMIN', 'OFICINA'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_CURSO',
      toState: 'CANCELADA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  EM_DIAGNOSTICO: [
    {
      fromState: 'EM_DIAGNOSTICO',
      toState: 'EM_REPARACAO',
      allowedRoles: ['ADMIN', 'OFICINA'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_DIAGNOSTICO',
      toState: 'CANCELADA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  EM_REPARACAO: [
    {
      fromState: 'EM_REPARACAO',
      toState: 'AGUARDA_MATERIAL',
      allowedRoles: ['ADMIN', 'OFICINA'],
      reasonRequired: true,
    },
    {
      fromState: 'EM_REPARACAO',
      toState: 'EM_INSPECCAO',
      allowedRoles: ['ADMIN', 'OFICINA'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_REPARACAO',
      toState: 'CANCELADA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  AGUARDA_MATERIAL: [
    {
      fromState: 'AGUARDA_MATERIAL',
      toState: 'EM_REPARACAO',
      allowedRoles: ['ADMIN', 'OFICINA', 'ARMAZEM'],
      reasonRequired: false,
    },
    {
      fromState: 'AGUARDA_MATERIAL',
      toState: 'CANCELADA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  EM_INSPECCAO: [
    // Quality review: approving or rejecting the work is a sign-off by
    // someone other than the technician who performed it, so OFICINA is
    // deliberately excluded from both outcomes here (unlike every other
    // WorkOrder transition, which OFICINA drives on its own work).
    {
      fromState: 'EM_INSPECCAO',
      toState: 'RESOLVIDA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: false,
    },
    {
      fromState: 'EM_INSPECCAO',
      toState: 'EM_REPARACAO',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: true,
    },
  ],
  RESOLVIDA: [],
  PENDENTE: [
    {
      fromState: 'PENDENTE',
      toState: 'ABERTA',
      allowedRoles: ['ADMIN', 'GESTAO'],
      reasonRequired: false,
    },
  ],
  CANCELADA: [],
}

/**
 * The transitions a given role may take from currentState - used to render
 * "what can I do next" controls without duplicating the transition tables
 * in the UI layer (one source of truth, per CLAUDE.md).
 */
export function getAvailableTransitions(
  entityType: 'asset' | 'workorder',
  currentState: string,
  role: UserRole
): { toState: string; reasonRequired: boolean }[] {
  const transitions = entityType === 'asset' ? ASSET_TRANSITIONS : WORKORDER_TRANSITIONS
  const fromTransitions = transitions[currentState] || []
  return fromTransitions
    .filter((t) => t.allowedRoles.includes(role))
    .map((t) => ({ toState: t.toState, reasonRequired: t.reasonRequired }))
}

export async function canTransition(
  entityType: 'asset' | 'workorder',
  currentState: string,
  targetState: string,
  role: UserRole
): Promise<boolean> {
  const transitions =
    entityType === 'asset' ? ASSET_TRANSITIONS : WORKORDER_TRANSITIONS
  const fromTransitions = transitions[currentState]
  if (!fromTransitions) return false

  const transition = fromTransitions.find((t) => t.toState === targetState)
  if (!transition) return false

  return transition.allowedRoles.includes(role)
}

export async function recordStateTransition(
  entityType: string,
  entityId: string,
  fromState: string,
  toState: string,
  userId: string,
  reason?: string
) {
  return prisma.stateTransition.create({
    data: {
      entityType,
      entityId,
      fromState,
      toState,
      reason,
      userId,
    },
  })
}

import { describe, it, expect } from 'vitest'
import {
  canTransition,
  ASSET_TRANSITIONS,
  WORKORDER_TRANSITIONS,
} from '@/lib/state-machine'
import type { UserRole } from '@prisma/client'

describe('State Machine - Asset', () => {
  describe('Valid transitions', () => {
    it('should allow EM_OPERACAO → EM_MANUTENCAO for OFICINA', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'EM_MANUTENCAO',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_MANUTENCAO → EM_OPERACAO for ADMIN', async () => {
      const result = await canTransition(
        'asset',
        'EM_MANUTENCAO',
        'EM_OPERACAO',
        'ADMIN'
      )
      expect(result).toBe(true)
    })

    it('should allow FORA_DE_SERVICO → QUARENTENA for OFICINA', async () => {
      const result = await canTransition(
        'asset',
        'FORA_DE_SERVICO',
        'QUARENTENA',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow QUARENTENA → ABATIDO for ADMIN', async () => {
      const result = await canTransition(
        'asset',
        'QUARENTENA',
        'ABATIDO',
        'ADMIN'
      )
      expect(result).toBe(true)
    })
  })

  describe('Invalid transitions', () => {
    it('should reject ABATIDO → EM_OPERACAO (terminal state)', async () => {
      const result = await canTransition(
        'asset',
        'ABATIDO',
        'EM_OPERACAO',
        'ADMIN'
      )
      expect(result).toBe(false)
    })

    it('should reject EM_OPERACAO → QUARENTENA (no direct path)', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'QUARENTENA',
        'ADMIN'
      )
      expect(result).toBe(false)
    })

    it('should reject invalid state', async () => {
      const result = await canTransition(
        'asset',
        'INVALID_STATE' as any,
        'EM_OPERACAO',
        'ADMIN'
      )
      expect(result).toBe(false)
    })
  })

  describe('Role-based access', () => {
    it('should allow ADMIN for EM_OPERACAO → FORA_DE_SERVICO', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'FORA_DE_SERVICO',
        'ADMIN'
      )
      expect(result).toBe(true)
    })

    it('should reject OFICINA for EM_OPERACAO → FORA_DE_SERVICO (GESTAO only)', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'FORA_DE_SERVICO',
        'OFICINA'
      )
      expect(result).toBe(false)
    })

    it('should allow GESTAO for EM_OPERACAO → FORA_DE_SERVICO', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'FORA_DE_SERVICO',
        'GESTAO'
      )
      expect(result).toBe(true)
    })

    it('should reject ARMAZEM for asset transitions', async () => {
      const result = await canTransition(
        'asset',
        'EM_OPERACAO',
        'EM_MANUTENCAO',
        'ARMAZEM'
      )
      expect(result).toBe(false)
    })
  })
})

describe('State Machine - WorkOrder', () => {
  describe('Valid transitions', () => {
    it('should allow ABERTA → EM_CURSO for OFICINA', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'EM_CURSO',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_CURSO → EM_DIAGNOSTICO for OFICINA', async () => {
      const result = await canTransition(
        'workorder',
        'EM_CURSO',
        'EM_DIAGNOSTICO',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_DIAGNOSTICO → EM_REPARACAO for ADMIN', async () => {
      const result = await canTransition(
        'workorder',
        'EM_DIAGNOSTICO',
        'EM_REPARACAO',
        'ADMIN'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_REPARACAO → AGUARDA_MATERIAL for OFICINA', async () => {
      const result = await canTransition(
        'workorder',
        'EM_REPARACAO',
        'AGUARDA_MATERIAL',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow AGUARDA_MATERIAL → EM_REPARACAO for ARMAZEM', async () => {
      const result = await canTransition(
        'workorder',
        'AGUARDA_MATERIAL',
        'EM_REPARACAO',
        'ARMAZEM'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_REPARACAO → EM_INSPECCAO for OFICINA', async () => {
      const result = await canTransition(
        'workorder',
        'EM_REPARACAO',
        'EM_INSPECCAO',
        'OFICINA'
      )
      expect(result).toBe(true)
    })

    it('should allow EM_INSPECCAO → RESOLVIDA for GESTAO (quality sign-off)', async () => {
      const result = await canTransition(
        'workorder',
        'EM_INSPECCAO',
        'RESOLVIDA',
        'GESTAO'
      )
      expect(result).toBe(true)
    })

    it('should reject EM_INSPECCAO → RESOLVIDA for OFICINA (cannot self-approve)', async () => {
      const result = await canTransition(
        'workorder',
        'EM_INSPECCAO',
        'RESOLVIDA',
        'OFICINA'
      )
      expect(result).toBe(false)
    })

    it('should allow EM_INSPECCAO → EM_REPARACAO for ADMIN', async () => {
      const result = await canTransition(
        'workorder',
        'EM_INSPECCAO',
        'EM_REPARACAO',
        'ADMIN'
      )
      expect(result).toBe(true)
    })

    it('should allow ABERTA → CANCELADA for GESTAO', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'CANCELADA',
        'GESTAO'
      )
      expect(result).toBe(true)
    })

    it('should allow PENDENTE → ABERTA for ADMIN', async () => {
      const result = await canTransition(
        'workorder',
        'PENDENTE',
        'ABERTA',
        'ADMIN'
      )
      expect(result).toBe(true)
    })
  })

  describe('Invalid transitions', () => {
    it('should reject RESOLVIDA → any state (terminal)', async () => {
      const result = await canTransition(
        'workorder',
        'RESOLVIDA',
        'EM_CURSO',
        'ADMIN'
      )
      expect(result).toBe(false)
    })

    it('should reject CANCELADA → any state (terminal)', async () => {
      const result = await canTransition(
        'workorder',
        'CANCELADA',
        'ABERTA',
        'ADMIN'
      )
      expect(result).toBe(false)
    })

    it('should reject EM_CURSO → EM_REPARACAO (must go through EM_DIAGNOSTICO)', async () => {
      const result = await canTransition(
        'workorder',
        'EM_CURSO',
        'EM_REPARACAO',
        'OFICINA'
      )
      expect(result).toBe(false)
    })

    it('should reject ABERTA → EM_INSPECCAO (invalid path)', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'EM_INSPECCAO',
        'ADMIN'
      )
      expect(result).toBe(false)
    })
  })

  describe('Role-based access', () => {
    it('should reject ARMAZEM for ABERTA → EM_CURSO', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'EM_CURSO',
        'ARMAZEM'
      )
      expect(result).toBe(false)
    })

    it('should reject OFICINA for ABERTA → CANCELADA', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'CANCELADA',
        'OFICINA'
      )
      expect(result).toBe(false)
    })

    it('should allow GESTAO for ABERTA → CANCELADA', async () => {
      const result = await canTransition(
        'workorder',
        'ABERTA',
        'CANCELADA',
        'GESTAO'
      )
      expect(result).toBe(true)
    })
  })

  describe('Complete workflow', () => {
    it('should support full repair workflow', async () => {
      const steps: Array<{
        from: string
        to: string
        role: UserRole
      }> = [
        { from: 'ABERTA', to: 'EM_CURSO', role: 'OFICINA' },
        { from: 'EM_CURSO', to: 'EM_DIAGNOSTICO', role: 'OFICINA' },
        { from: 'EM_DIAGNOSTICO', to: 'EM_REPARACAO', role: 'OFICINA' },
        { from: 'EM_REPARACAO', to: 'AGUARDA_MATERIAL', role: 'OFICINA' },
        { from: 'AGUARDA_MATERIAL', to: 'EM_REPARACAO', role: 'ARMAZEM' },
        { from: 'EM_REPARACAO', to: 'EM_INSPECCAO', role: 'OFICINA' },
        { from: 'EM_INSPECCAO', to: 'RESOLVIDA', role: 'GESTAO' },
      ]

      for (const step of steps) {
        const result = await canTransition(
          'workorder',
          step.from,
          step.to,
          step.role
        )
        expect(result).toBe(true)
      }
    })
  })
})

describe('Transition metadata', () => {
  it('should have all transitions defined', () => {
    expect(ASSET_TRANSITIONS).toBeDefined()
    expect(WORKORDER_TRANSITIONS).toBeDefined()
  })

  it('should have ADMIN access to critical transitions', () => {
    const assetTransitions = ASSET_TRANSITIONS['EM_OPERACAO']
    const cancelTransition = assetTransitions.find(
      (t) => t.toState === 'FORA_DE_SERVICO'
    )
    expect(cancelTransition?.allowedRoles).toContain('ADMIN')
  })

  it('should require reason for certain transitions', () => {
    const assetTransitions = ASSET_TRANSITIONS['EM_OPERACAO']
    const cancelTransition = assetTransitions.find(
      (t) => t.toState === 'FORA_DE_SERVICO'
    )
    expect(cancelTransition?.reasonRequired).toBe(true)
  })
})

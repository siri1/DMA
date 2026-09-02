import { describe, it, expect } from 'vitest'
import { createAssetSchema, updateAssetSchema } from '@/modules/assets/validators'

describe('Asset Validators', () => {
  describe('createAssetSchema', () => {
    it('should validate a complete asset', () => {
      const data = {
        assetCode: 'EMPI-001',
        description: 'Empilhador Frontal Toyota 3.0T',
        brand: 'Toyota',
        model: '8FGU30',
        serialNumber: 'BF0328742',
        entryDate: new Date('2022-06-15'),
        diagnosis: 'Operacional',
        location: 'Warehouse A',
        family: 'Empilhadores',
      }

      const result = createAssetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require assetCode and description', () => {
      const data = {
        brand: 'Toyota',
        entryDate: new Date(),
      }

      const result = createAssetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject assetCode < 3 chars', () => {
      const data = {
        assetCode: 'EM',
        description: 'Test',
        entryDate: new Date(),
      }

      const result = createAssetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const data = {
        assetCode: 'VIAT-001',
        description: 'Viatura de transporte',
        entryDate: new Date('2019-11-05'),
      }

      const result = createAssetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('updateAssetSchema', () => {
    it('should allow partial updates', () => {
      const data = {
        description: 'Novo nome',
        location: 'Site B',
      }

      const result = updateAssetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const data = {}

      const result = updateAssetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})

describe('Asset Services', () => {
  it('should have proper import paths', () => {
    // Verificar que os módulos existem
    expect(createAssetSchema).toBeDefined()
    expect(updateAssetSchema).toBeDefined()
  })
})

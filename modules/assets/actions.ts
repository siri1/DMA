'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { createAssetSchema, updateAssetSchema } from './validators'
import {
  createAsset as createAssetService,
  updateAsset as updateAssetService,
  deleteAsset as deleteAssetService,
  getAssetById,
} from './services'

export async function createAssetAction(formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'create')) {
    throw new Error('Forbidden')
  }

  const validated = createAssetSchema.parse(formData)
  const asset = await createAssetService(validated)

  // Auditoria
  await createAuditLog({
    userId: session.user.id as string,
    action: 'CREATE',
    module: 'assets',
    entityType: 'asset',
    entityId: asset.id,
    after: asset as any,
  })

  return asset
}

export async function updateAssetAction(id: string, formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'edit')) {
    throw new Error('Forbidden')
  }

  const before = await getAssetById(id)
  const validated = updateAssetSchema.parse(formData)
  const asset = await updateAssetService(id, validated)

  // Auditoria
  await createAuditLog({
    userId: session.user.id as string,
    action: 'UPDATE',
    module: 'assets',
    entityType: 'asset',
    entityId: asset.id,
    before: before ? (before as any) : undefined,
    after: asset as any,
  })

  return asset
}

export async function deleteAssetAction(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'delete')) {
    throw new Error('Forbidden')
  }

  const before = await getAssetById(id)
  const asset = await deleteAssetService(id)

  // Auditoria
  await createAuditLog({
    userId: session.user.id as string,
    action: 'DELETE',
    module: 'assets',
    entityType: 'asset',
    entityId: id,
    before: before ? (before as any) : undefined,
  })

  return asset
}

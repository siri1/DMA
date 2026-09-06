'use client'

import { useState } from 'react'
import { MaintenanceType } from '@prisma/client'
import { createMaintenancePlanAction, updateMaintenancePlanAction } from '@/modules/maintenance-plans/actions'
import { AlertTriangle, ShieldCheck, Repeat, Calendar, Loader2, Check, Plus } from 'lucide-react'

export interface MaintenancePlanFormValues {
  id: string
  type: MaintenanceType
  periodicityDays: number
  nextDueAt: string | Date
  active: boolean
}

interface MaintenancePlanFormProps {
  plan?: MaintenancePlanFormValues
  assetId?: string
  onSuccess?: () => void
}

export function MaintenancePlanForm({ plan, assetId, onSuccess }: MaintenancePlanFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        assetId: assetId || formData.get('assetId'),
        type: formData.get('type'),
        periodicityDays: parseInt(formData.get('periodicityDays') as string),
        nextDueAt: formData.get('nextDueAt'),
        active: formData.get('active') === 'on',
      }

      if (plan) {
        await updateMaintenancePlanAction(plan.id, data)
      } else {
        await createMaintenancePlanAction(data)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar plano')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <ShieldCheck size={14} /> Tipo de Manutenção
        </label>
        <select
          name="type"
          defaultValue={plan?.type || MaintenanceType.PREVENTIVA}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          required
        >
          <option value={MaintenanceType.PREVENTIVA}>Preventiva</option>
          <option value={MaintenanceType.CORRECTIVA}>Correctiva</option>
          <option value={MaintenanceType.INSPECCAO}>Inspecção</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Repeat size={14} /> Periodicidade (dias)
        </label>
        <input
          type="number"
          name="periodicityDays"
          min="1"
          defaultValue={plan?.periodicityDays || 30}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Calendar size={14} /> Próxima Data
        </label>
        <input
          type="date"
          name="nextDueAt"
          defaultValue={plan?.nextDueAt ? new Date(plan.nextDueAt).toISOString().split('T')[0] : ''}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="flex items-center">
          <input type="checkbox" name="active" defaultChecked={plan?.active !== false} className="w-4 h-4 rounded" />
          <span className="ml-2 text-sm text-gray-700">Activo</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> A guardar...
          </>
        ) : plan ? (
          <>
            <Check size={16} /> Actualizar
          </>
        ) : (
          <>
            <Plus size={16} /> Criar Plano
          </>
        )}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { createWorkOrderAction } from '@/modules/workorders/actions'

interface WorkOrderFormProps {
  assetId?: string
  onSuccess?: () => void
}

export function WorkOrderForm({ assetId, onSuccess }: WorkOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      await createWorkOrderAction({
        ...data,
        assetId: assetId || data.assetId,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar OT')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          📝 Resumo *
        </label>
        <textarea
          name="summary"
          required
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Descrição breve do problema"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            🎯 Origem *
          </label>
          <select
            name="origin"
            required
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          >
            <option value="AVARIA">⚡ Avaria</option>
            <option value="PLANO">🗓️ Plano</option>
            <option value="MANUAL">✋ Manual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            🚦 Prioridade *
          </label>
          <select
            name="priority"
            required
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          >
            <option value="BAIXA">🟢 Baixa</option>
            <option value="MEDIA">🟡 Média</option>
            <option value="ALTA">🟠 Alta</option>
            <option value="CRITICA">🔴 Crítica</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          ⏰ Prazo (opcional)
        </label>
        <input
          type="date"
          name="dueAt"
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20"
      >
        {loading ? '⏳ A criar...' : '➕ Criar Ordem de Trabalho'}
      </button>
    </form>
  )
}

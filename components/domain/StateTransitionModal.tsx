'use client'

import { useState } from 'react'
import { transitionAssetStateAction } from '@/modules/states/actions'
import type { AssetStatus } from '@prisma/client'

interface StateTransitionModalProps {
  assetId: string
  currentState: AssetStatus
  targetState: AssetStatus
  onSuccess?: () => void
  onClose?: () => void
}

export function StateTransitionModal({
  assetId,
  currentState,
  targetState,
  onSuccess,
  onClose,
}: StateTransitionModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requiresReason = ['CANCELADA', 'PENDENTE', 'AGUARDA_MATERIAL'].includes(targetState)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (requiresReason && !reason.trim()) {
      setError('Motivo obrigatório para esta transição')
      return
    }

    setLoading(true)
    setError('')

    try {
      await transitionAssetStateAction(assetId, targetState, reason || undefined)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na transição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mudar Estado de Equipamento
        </h2>

        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Estado actual:</span> {currentState}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Novo estado:</span> {targetState}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresReason && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Motivo *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Explique o motivo desta mudança de estado"
                required={requiresReason}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'A processar...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { transitionAssetStateAction } from '@/modules/states/actions'
import type { AssetStatus } from '@prisma/client'
import { ASSET_STATUS, FALLBACK_META } from '@/lib/status-icons'
import { ArrowLeftRight, FileEdit, AlertTriangle, Loader2, Check, ArrowRight } from 'lucide-react'

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
  const currentMeta = ASSET_STATUS[currentState] || { ...FALLBACK_META, label: currentState }
  const targetMeta = ASSET_STATUS[targetState] || { ...FALLBACK_META, label: targetState }
  const CurrentIcon = currentMeta.icon
  const TargetIcon = targetMeta.icon

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowLeftRight size={18} /> Mudar Estado de Equipamento
        </h2>

        <div className="mb-5 flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl">
          <span className={`text-sm flex items-center gap-1.5 ${currentMeta.text}`}>
            <CurrentIcon size={15} /> {currentMeta.label}
          </span>
          <ArrowRight size={16} className="text-gray-300" />
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${targetMeta.text}`}>
            <TargetIcon size={15} /> {targetMeta.label}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresReason && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <FileEdit size={14} /> Motivo *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explique o motivo desta mudança de estado"
                required={requiresReason}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> A processar...
                </>
              ) : (
                <>
                  <Check size={15} /> Confirmar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

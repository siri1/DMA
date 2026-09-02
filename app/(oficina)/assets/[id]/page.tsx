'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AssetForm } from '@/components/domain/AssetForm'
import { StateTransitionModal } from '@/components/domain/StateTransitionModal'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { Asset, AssetStatus, StateTransition } from '@prisma/client'

export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params.id as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [transitions, setTransitions] = useState<StateTransition[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showStateModal, setShowStateModal] = useState(false)
  const [targetState, setTargetState] = useState<AssetStatus | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}`)
        if (res.ok) {
          const data = await res.json()
          setAsset(data)

          const trRes = await fetch(`/api/assets/${assetId}/state-transitions`)
          if (trRes.ok) {
            setTransitions(await trRes.json())
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [assetId])

  if (loading) return <div className="p-8">A carregar...</div>
  if (!asset) return <div className="p-8">Equipamento não encontrado</div>

  const possibleStates: Record<AssetStatus, AssetStatus[]> = {
    EM_OPERACAO: ['EM_MANUTENCAO', 'FORA_DE_SERVICO'],
    EM_MANUTENCAO: ['EM_OPERACAO', 'INDISPONIVEL'],
    INDISPONIVEL: ['EM_OPERACAO', 'FORA_DE_SERVICO'],
    FORA_DE_SERVICO: ['QUARENTENA', 'EM_OPERACAO'],
    QUARENTENA: ['EM_OPERACAO', 'ABATIDO'],
    ABATIDO: [],
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{asset.description}</h1>
          <p className="text-gray-600 mt-2">Código: {asset.assetCode}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-white rounded-lg shadow p-6">
              <AssetForm
                asset={asset}
                onSuccess={() => {
                  setEditing(false)
                  window.location.reload()
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalhes
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-700">Marca</dt>
                    <dd className="text-gray-600">{asset.brand || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Modelo</dt>
                    <dd className="text-gray-600">{asset.model || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Série</dt>
                    <dd className="text-gray-600">{asset.serialNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Localização</dt>
                    <dd className="text-gray-600">{asset.location || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Família</dt>
                    <dd className="text-gray-600">{asset.family || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Data Entrada</dt>
                    <dd className="text-gray-600">{formatDate(asset.entryDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Diagnóstico</dt>
                    <dd className="text-gray-600">{asset.diagnosis || '—'}</dd>
                  </div>
                </dl>
              </div>

              {transitions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Histórico de Estados
                  </h2>
                  <div className="space-y-3 text-sm">
                    {transitions.map((t) => (
                      <div key={t.id} className="border-l-4 border-blue-500 pl-3">
                        <p className="font-medium text-gray-900">
                          {t.fromState} → {t.toState}
                        </p>
                        {t.reason && (
                          <p className="text-gray-600">{t.reason}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDateTime(t.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mudança de Estado
          </h2>

          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800 font-medium">Estado actual:</p>
            <p className="text-2xl font-bold text-blue-900">{asset.status}</p>
          </div>

          {possibleStates[asset.status].length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">
                Transições disponíveis:
              </p>
              {possibleStates[asset.status].map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setTargetState(state)
                    setShowStateModal(true)
                  }}
                  className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded text-sm font-medium text-gray-900 border border-gray-200"
                >
                  → {state}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Este equipamento está em estado terminal (ABATIDO).
            </p>
          )}
        </div>
      </div>

      {showStateModal && targetState && (
        <StateTransitionModal
          assetId={assetId}
          currentState={asset.status}
          targetState={targetState}
          onSuccess={() => {
            setShowStateModal(false)
            window.location.reload()
          }}
          onClose={() => setShowStateModal(false)}
        />
      )}
    </div>
  )
}

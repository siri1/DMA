'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AssetForm } from '@/components/domain/AssetForm'
import { StateTransitionModal } from '@/components/domain/StateTransitionModal'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { Asset, AssetStatus, StateTransition } from '@prisma/client'

const STATUS_META: Record<string, { emoji: string; accent: string }> = {
  EM_OPERACAO: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800' },
  EM_MANUTENCAO: { emoji: '🔧', accent: 'bg-amber-100 text-amber-800' },
  INDISPONIVEL: { emoji: '🚫', accent: 'bg-red-100 text-red-800' },
  FORA_DE_SERVICO: { emoji: '⛔', accent: 'bg-gray-100 text-gray-800' },
  QUARENTENA: { emoji: '⚠️', accent: 'bg-orange-100 text-orange-800' },
  ABATIDO: { emoji: '🗑️', accent: 'bg-slate-200 text-slate-800' },
}

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
    const fetchData = async () => {
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

    fetchData()
  }, [assetId])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">🚜</div>
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }
  if (!asset) return <div className="p-8">❌ Equipamento não encontrado</div>

  const possibleStates: Record<AssetStatus, AssetStatus[]> = {
    EM_OPERACAO: ['EM_MANUTENCAO', 'FORA_DE_SERVICO'],
    EM_MANUTENCAO: ['EM_OPERACAO', 'INDISPONIVEL'],
    INDISPONIVEL: ['EM_OPERACAO', 'FORA_DE_SERVICO'],
    FORA_DE_SERVICO: ['QUARENTENA', 'EM_OPERACAO'],
    QUARENTENA: ['EM_OPERACAO', 'ABATIDO'],
    ABATIDO: [],
  }

  const meta = STATUS_META[asset.status] || { emoji: '❔', accent: 'bg-gray-100 text-gray-800' }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>🚜</span> {asset.description}
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{asset.assetCode}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
        >
          {editing ? '✕ Cancelar' : '✏️ Editar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
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
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">📋 Detalhes</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🏭 Marca</dt><dd className="text-gray-800 mt-0.5">{asset.brand || '—'}</dd></div>
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🔩 Modelo</dt><dd className="text-gray-800 mt-0.5">{asset.model || '—'}</dd></div>
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🔢 Série</dt><dd className="text-gray-800 mt-0.5">{asset.serialNumber || '—'}</dd></div>
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">📍 Localização</dt><dd className="text-gray-800 mt-0.5">{asset.location || '—'}</dd></div>
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🗂️ Família</dt><dd className="text-gray-800 mt-0.5">{asset.family || '—'}</dd></div>
                  <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🗓️ Data Entrada</dt><dd className="text-gray-800 mt-0.5">{formatDate(asset.entryDate)}</dd></div>
                  <div className="col-span-2"><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🩺 Diagnóstico</dt><dd className="text-gray-800 mt-0.5">{asset.diagnosis || '—'}</dd></div>
                </dl>
              </div>

              {transitions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">🔄 Histórico de Estados</h2>
                  <div className="space-y-3 text-sm">
                    {transitions.map((t) => (
                      <div key={t.id} className="border-l-4 border-blue-500 pl-3">
                        <p className="font-medium text-gray-900">{t.fromState} → {t.toState}</p>
                        {t.reason && <p className="text-gray-600">{t.reason}</p>}
                        <p className="text-xs text-gray-400">{formatDateTime(t.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">🔀 Mudança de Estado</h2>

          <div className={`mb-4 p-4 rounded-xl ${meta.accent}`}>
            <p className="text-xs font-medium opacity-75">Estado actual</p>
            <p className="text-xl font-bold mt-1 flex items-center gap-2">{meta.emoji} {asset.status}</p>
          </div>

          {possibleStates[asset.status].length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transições disponíveis</p>
              {possibleStates[asset.status].map((state) => {
                const stateMeta = STATUS_META[state] || { emoji: '❔' }
                return (
                  <button
                    key={state}
                    onClick={() => {
                      setTargetState(state)
                      setShowStateModal(true)
                    }}
                    className="w-full px-3.5 py-2.5 text-left bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-900 ring-1 ring-gray-200 transition-colors flex items-center gap-2"
                  >
                    <span>{stateMeta.emoji}</span> → {state}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Este equipamento está em estado terminal (ABATIDO).</p>
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

'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/formatters'

const DECISIONS = [
  { value: 'REPARAR', label: 'Reparar', emoji: '🔧', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'REAPROVEITAR', label: 'Reaproveitar', emoji: '♻️', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { value: 'TRANSFERIR', label: 'Transferir', emoji: '📤', color: 'bg-amber-600 hover:bg-amber-700' },
  { value: 'ABATER', label: 'Abater', emoji: '🗑️', color: 'bg-red-600 hover:bg-red-700' },
]

interface QuarantineRow {
  id: string
  enteredAt: string
  technicalOpinion: string | null
  decision: string | null
  decidedAt: string | null
  asset: { assetCode: string; description: string }
}

export default function QuarantinePage() {
  const [quarantines, setQuarantines] = useState<QuarantineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/quarantine')
      if (res.ok) setQuarantines(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const decide = async (id: string, decision: string) => {
    setDeciding(id)
    try {
      const res = await fetch(`/api/quarantine/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) await load()
    } finally {
      setDeciding(null)
    }
  }

  const pending = quarantines.filter((q) => !q.decision)
  const decided = quarantines.filter((q) => q.decision)

  const daysIn = (d: string) =>
    Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000))

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">⚠️</div>
          <p className="text-sm">A carregar quarentena...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <span>⚠️</span> Quarentena e Sucata
      </h1>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ⏳ Aguardam Decisão <span className="text-xs font-normal text-gray-400">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-gray-400 text-sm">Sem equipamentos em quarentena.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map((q) => {
              const days = daysIn(q.enteredAt)
              const overdue = days > 30
              return (
                <div
                  key={q.id}
                  className={`p-5 bg-white rounded-2xl shadow-sm ring-1 ${
                    overdue ? 'ring-red-200 bg-red-50/30' : 'ring-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        🚜 {q.asset.assetCode} — {q.asset.description}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {q.technicalOpinion || '— Sem parecer técnico'}
                      </p>
                      <p className={`text-xs mt-2 flex items-center gap-1.5 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {overdue ? '🚨' : '🕐'} Entrou {formatDate(new Date(q.enteredAt))} — {days} dia(s)
                        {overdue && ' — ALERTA: sem decisão há mais de 30 dias'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {DECISIONS.map((d) => (
                      <button
                        key={d.value}
                        disabled={deciding === q.id}
                        onClick={() => decide(q.id, d.value)}
                        className={`px-3.5 py-2 text-sm text-white rounded-xl font-medium ${d.color} disabled:opacity-50 transition-colors flex items-center gap-1.5`}
                      >
                        <span>{d.emoji}</span> {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📜 Histórico de Decisões <span className="text-xs font-normal text-gray-400">({decided.length})</span>
        </h2>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Decisão</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Decidido em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {decided.map((q) => {
                const meta = DECISIONS.find((d) => d.value === q.decision)
                return (
                  <tr key={q.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 text-gray-900">
                      🚜 {q.asset.assetCode} — {q.asset.description}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(new Date(q.enteredAt))}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {meta?.emoji} {q.decision}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {q.decidedAt ? formatDate(new Date(q.decidedAt)) : '—'}
                    </td>
                  </tr>
                )
              })}
              {decided.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">Sem decisões registadas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

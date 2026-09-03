'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/formatters'

const DECISIONS = [
  { value: 'REPARAR', label: 'Reparar', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'REAPROVEITAR', label: 'Reaproveitar', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'TRANSFERIR', label: 'Transferir', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { value: 'ABATER', label: 'Abater', color: 'bg-red-600 hover:bg-red-700' },
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

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quarentena e Sucata</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aguardam Decisão ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm">Sem equipamentos em quarentena.</p>
        ) : (
          <div className="grid gap-4">
            {pending.map((q) => {
              const days = daysIn(q.enteredAt)
              const overdue = days > 30
              return (
                <div
                  key={q.id}
                  className={`p-5 bg-white rounded-lg shadow border-l-4 ${
                    overdue ? 'border-red-500' : 'border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {q.asset.assetCode} — {q.asset.description}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {q.technicalOpinion || 'Sem parecer técnico'}
                      </p>
                      <p className={`text-xs mt-2 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        Entrou {formatDate(new Date(q.enteredAt))} — {days} dia(s)
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
                        className={`px-3 py-1.5 text-sm text-white rounded ${d.color} disabled:opacity-50`}
                      >
                        {d.label}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Histórico de Decisões ({decided.length})
        </h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Equipamento</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Entrada</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Decisão</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Decidido em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {decided.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 text-gray-900">
                    {q.asset.assetCode} — {q.asset.description}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(new Date(q.enteredAt))}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{q.decision}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {q.decidedAt ? formatDate(new Date(q.decidedAt)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

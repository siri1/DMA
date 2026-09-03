'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/formatters'

interface PlanRow {
  id: string
  type: string
  periodicityDays: number
  nextDueAt: string
  asset: { description: string; assetCode: string }
}

const TYPE_EMOJI: Record<string, string> = {
  PREVENTIVA: '🛡️',
  CORRECTIVA: '🔧',
  INSPECCAO: '🔎',
}

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/maintenance-plans')
        if (res.ok) {
          setPlans(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const overdue = plans.filter((p) => new Date(p.nextDueAt) < new Date())
  const upcoming = plans.filter((p) => new Date(p.nextDueAt) >= new Date())

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">🗓️</div>
          <p className="text-sm">A carregar planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span>🗓️</span> Planos de Manutenção
        </h1>
        <Link
          href="/oficina/maintenance-plans/new"
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
        >
          ➕ Novo Plano
        </Link>
      </div>

      {overdue.length > 0 && (
        <div className="mb-8 p-5 bg-red-50 ring-1 ring-red-100 rounded-2xl">
          <h2 className="text-base font-semibold text-red-900 mb-4 flex items-center gap-2">
            🚨 {overdue.length} Plano(s) Vencido(s)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdue.map((plan) => (
              <Link
                key={plan.id}
                href={`/oficina/maintenance-plans/${plan.id}`}
                className="p-4 bg-white rounded-xl ring-1 ring-red-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <p className="font-medium text-gray-900">{plan.asset.description}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  {TYPE_EMOJI[plan.type] || '📌'} {plan.type}
                </p>
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  ⏰ Vencido: {formatDate(new Date(plan.nextDueAt))}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📅 Próximos <span className="text-xs font-normal text-gray-400">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
            <p className="text-gray-400 text-sm">✨ Sem planos futuros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((plan) => (
              <Link
                key={plan.id}
                href={`/oficina/maintenance-plans/${plan.id}`}
                className="p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <p className="font-medium text-gray-900">{plan.asset.description}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  {TYPE_EMOJI[plan.type] || '📌'} {plan.type} — Cada {plan.periodicityDays} dias
                </p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  🗓️ Próxima: {formatDate(new Date(plan.nextDueAt))}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

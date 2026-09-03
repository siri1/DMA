'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/formatters'

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<any[]>([])
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

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Planos de Manutenção</h1>
        <Link
          href="/oficina/maintenance-plans/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Novo Plano
        </Link>
      </div>

      {overdue.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            ⚠️ {overdue.length} Plano(s) Vencido(s)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdue.map((plan) => (
              <Link
                key={plan.id}
                href={`/oficina/maintenance-plans/${plan.id}`}
                className="p-4 bg-white rounded-lg border-l-4 border-red-500 hover:shadow-md transition"
              >
                <p className="font-medium text-gray-900">{plan.asset.description}</p>
                <p className="text-sm text-gray-600">{plan.type}</p>
                <p className="text-xs text-red-600 mt-2">
                  Vencido: {formatDate(new Date(plan.nextDueAt))}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Próximos ({upcoming.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((plan) => (
            <Link
              key={plan.id}
              href={`/oficina/maintenance-plans/${plan.id}`}
              className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 hover:shadow-md transition"
            >
              <p className="font-medium text-gray-900">{plan.asset.description}</p>
              <p className="text-sm text-gray-600">
                {plan.type} — Cada {plan.periodicityDays} dias
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Próxima: {formatDate(new Date(plan.nextDueAt))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

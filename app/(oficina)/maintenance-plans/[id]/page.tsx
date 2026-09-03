'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { MaintenancePlanForm } from '@/components/domain/MaintenancePlanForm'

export default function MaintenancePlanDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/maintenance-plans/${id}`)
        if (res.ok) {
          setPlan(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [id])

  if (loading) return <div className="p-8">A carregar...</div>
  if (!plan) return <div className="p-8">Plano não encontrado</div>

  const isOverdue = new Date(plan.nextDueAt) < new Date()

  return (
    <div className="p-8">
      <Link href="/oficina/maintenance-plans" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Voltar
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{plan.asset.description}</h1>
          <p className="text-gray-600 mt-2">{plan.type}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-white rounded-lg shadow p-6">
              <MaintenancePlanForm
                plan={plan}
                onSuccess={() => {
                  setEditing(false)
                  window.location.reload()
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-700">Tipo</dt>
                    <dd className="text-gray-600">{plan.type}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Periodicidade</dt>
                    <dd className="text-gray-600">{plan.periodicityDays} dias</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Próxima Manutenção</dt>
                    <dd
                      className={`font-medium ${
                        isOverdue ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {formatDate(new Date(plan.nextDueAt))}
                      {isOverdue && ' (VENCIDA)'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Status</dt>
                    <dd className={plan.active ? 'text-green-600' : 'text-gray-400'}>
                      {plan.active ? 'Activo' : 'Inactivo'}
                    </dd>
                  </div>
                </dl>
              </div>

              {plan.generatedWorkOrders && plan.generatedWorkOrders.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    OT Geradas ({plan.generatedWorkOrders.length})
                  </h2>
                  <div className="space-y-2 text-sm">
                    {plan.generatedWorkOrders.map((wo: any) => (
                      <div key={wo.id} className="p-3 border border-gray-200 rounded">
                        <p className="font-medium text-gray-900">{wo.number}</p>
                        <p className="text-gray-600">{wo.status}</p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(new Date(wo.createdAt))}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipamento</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-700">Código</dt>
              <dd className="text-gray-600">{plan.asset.assetCode}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Família</dt>
              <dd className="text-gray-600">{plan.asset.family || '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 pt-6 border-t">
            <Link
              href={`/oficina/assets/${plan.assetId}`}
              className="w-full inline-block text-center px-4 py-2 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200"
            >
              Ver Equipamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

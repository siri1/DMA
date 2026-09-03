'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { WorkOrder, Intervention } from '@prisma/client'
import { formatDate, formatDateTime } from '@/lib/formatters'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const workOrderId = params.id as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const woRes = await fetch(`/api/workorders/${workOrderId}`)
        if (woRes.ok) {
          const wo = await woRes.json()
          setWorkOrder(wo)

          const intRes = await fetch(`/api/workorders/${workOrderId}/interventions`)
          if (intRes.ok) {
            setInterventions(await intRes.json())
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workOrderId])

  if (loading) return <div className="p-8">A carregar...</div>
  if (!workOrder) return <div className="p-8">OT não encontrada</div>

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{workOrder.number}</h1>
        <p className="text-gray-600 mt-2">{workOrder.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Estado</dt>
                <dd className="text-gray-600">{workOrder.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Prioridade</dt>
                <dd className="text-gray-600">{workOrder.priority}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Origem</dt>
                <dd className="text-gray-600">{workOrder.origin}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Aberto em</dt>
                <dd className="text-gray-600">{formatDateTime(workOrder.openedAt)}</dd>
              </div>
              {workOrder.dueAt && (
                <div>
                  <dt className="font-medium text-gray-700">Prazo</dt>
                  <dd className="text-gray-600">{formatDate(workOrder.dueAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {interventions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Intervenções ({interventions.length})
              </h2>
              <div className="space-y-4">
                {interventions.map((int) => (
                  <div key={int.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <p className="font-medium text-gray-900">{int.diagnosis || 'Sem diagnóstico'}</p>
                    {int.activities && (
                      <p className="text-sm text-gray-600 mt-1">{int.activities}</p>
                    )}
                    {int.laborMinutes && (
                      <p className="text-xs text-gray-500 mt-2">{int.laborMinutes} min de trabalho</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {int.startedAt ? formatDateTime(int.startedAt) : 'Não iniciada'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acções</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium text-blue-900">
              + Adicionar Intervenção
            </button>
            <button className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded text-sm font-medium text-gray-900">
              Mudança de Estado
            </button>
            <button className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded text-sm font-medium text-gray-900">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

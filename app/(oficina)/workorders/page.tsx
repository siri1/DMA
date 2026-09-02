'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WorkOrderCard } from '@/components/domain/WorkOrderCard'
import type { WorkOrder } from '@prisma/client'

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<(WorkOrder & { asset?: { description: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
        const res = await fetch(`/api/workorders${params}`)
        if (res.ok) {
          setWorkOrders(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWorkOrders()
  }, [statusFilter])

  const statuses = [
    'ALL',
    'ABERTA',
    'EM_CURSO',
    'EM_DIAGNOSTICO',
    'EM_REPARACAO',
    'AGUARDA_MATERIAL',
    'EM_INSPECCAO',
    'RESOLVIDA',
  ]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Trabalho</h1>
          <p className="text-gray-600 mt-2">Gestão de tarefas de manutenção</p>
        </div>
        <Link
          href="/oficina/workorders/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Nova OT
        </Link>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">A carregar OT...</p>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Nenhuma OT encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workOrders.map((wo) => (
            <Link key={wo.id} href={`/oficina/workorders/${wo.id}`}>
              <WorkOrderCard workOrder={wo} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WorkOrderCard } from '@/components/domain/WorkOrderCard'
import type { WorkOrder } from '@prisma/client'

const STATUS_META: Record<string, string> = {
  ALL: '📋',
  ABERTA: '🆕',
  EM_CURSO: '⏳',
  EM_DIAGNOSTICO: '🩺',
  EM_REPARACAO: '🔧',
  AGUARDA_MATERIAL: '📦',
  EM_INSPECCAO: '🔎',
  RESOLVIDA: '✅',
}

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

  const statuses = Object.keys(STATUS_META)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>🛠️</span> Ordens de Trabalho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de tarefas de manutenção</p>
        </div>
        <Link
          href="/oficina/workorders/new"
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
        >
          ➕ Nova OT
        </Link>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{STATUS_META[status]}</span> {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">🛠️</div>
          <p className="text-sm">A carregar OT...</p>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-gray-500 text-sm">Nenhuma OT encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

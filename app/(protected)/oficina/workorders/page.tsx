'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WorkOrderCard } from '@/components/domain/WorkOrderCard'
import type { WorkOrder } from '@prisma/client'
import { WORKORDER_STATUS, FALLBACK_META } from '@/lib/status-icons'
import { ClipboardList, Plus, LayoutGrid, FolderOpen } from 'lucide-react'

const ALL_META = { icon: LayoutGrid, text: 'text-gray-600', badge: '', label: 'Todos' }

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
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList size={28} /> Ordens de Trabalho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de tarefas de manutenção</p>
        </div>
        <Link
          href="/oficina/workorders/new"
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nova OT
        </Link>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {statuses.map((status) => {
          const meta = status === 'ALL' ? ALL_META : WORKORDER_STATUS[status] || { ...FALLBACK_META, label: status }
          const Icon = meta.icon
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} /> {meta.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar OT...</p>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-gray-300" />
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

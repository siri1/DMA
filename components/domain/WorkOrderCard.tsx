import type { WorkOrder } from '@prisma/client'
import { formatDate } from '@/lib/formatters'

const statusColors: Record<string, string> = {
  ABERTA: 'bg-blue-100 text-blue-800',
  EM_CURSO: 'bg-yellow-100 text-yellow-800',
  EM_DIAGNOSTICO: 'bg-purple-100 text-purple-800',
  EM_REPARACAO: 'bg-orange-100 text-orange-800',
  AGUARDA_MATERIAL: 'bg-red-100 text-red-800',
  EM_INSPECCAO: 'bg-indigo-100 text-indigo-800',
  RESOLVIDA: 'bg-green-100 text-green-800',
  PENDENTE: 'bg-gray-100 text-gray-800',
  CANCELADA: 'bg-slate-100 text-slate-800',
}

const priorityColors: Record<string, string> = {
  CRITICA: 'bg-red-500 text-white',
  ALTA: 'bg-orange-500 text-white',
  MEDIA: 'bg-yellow-500 text-white',
  BAIXA: 'bg-green-500 text-white',
}

interface WorkOrderCardProps {
  workOrder: WorkOrder & { asset?: { description: string } }
  onClick?: () => void
}

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const statusColor = statusColors[workOrder.status] || 'bg-gray-100'
  const priorityColor = priorityColors[workOrder.priority] || 'bg-gray-500'

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-600">{workOrder.number}</p>
          <p className="text-lg font-semibold text-gray-900">{workOrder.summary}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor}`}>
          {workOrder.priority}
        </span>
      </div>

      <div className="mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {workOrder.status}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {workOrder.asset && <p>Equipamento: {workOrder.asset.description}</p>}
        <p>Aberto: {formatDate(workOrder.openedAt)}</p>
        {workOrder.dueAt && <p>Prazo: {formatDate(workOrder.dueAt)}</p>}
      </div>
    </div>
  )
}

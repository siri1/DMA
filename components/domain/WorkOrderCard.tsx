import type { WorkOrder } from '@prisma/client'
import { formatDate } from '@/lib/formatters'
import { WORKORDER_STATUS, WORKORDER_PRIORITY, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { Wrench, Calendar, AlarmClock } from 'lucide-react'

interface WorkOrderCardProps {
  workOrder: WorkOrder & { asset?: { description: string } }
  onClick?: () => void
}

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const status = WORKORDER_STATUS[workOrder.status] || { ...FALLBACK_META, label: workOrder.status }
  const priority = WORKORDER_PRIORITY[workOrder.priority] || { ...FALLBACK_META, badge: 'bg-gray-400 text-white', label: workOrder.priority }

  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 font-mono">{workOrder.number}</p>
          <p className="text-base font-semibold text-gray-900 truncate">{workOrder.summary}</p>
        </div>
        <StatusBadge meta={priority} className="shrink-0" />
      </div>

      <div className="mb-3">
        <StatusBadge meta={status} />
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {workOrder.asset && (
          <p className="flex items-center gap-1.5 truncate">
            <Wrench size={13} className="text-gray-400 shrink-0" /> {workOrder.asset.description}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" /> Aberto: {formatDate(workOrder.openedAt)}
        </p>
        {workOrder.dueAt && (
          <p className="flex items-center gap-1.5">
            <AlarmClock size={13} className="text-gray-400" /> Prazo: {formatDate(workOrder.dueAt)}
          </p>
        )}
      </div>
    </div>
  )
}

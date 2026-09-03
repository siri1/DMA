import type { WorkOrder } from '@prisma/client'
import { formatDate } from '@/lib/formatters'

const STATUS_META: Record<string, { emoji: string; accent: string }> = {
  ABERTA: { emoji: '🆕', accent: 'bg-blue-100 text-blue-800' },
  EM_CURSO: { emoji: '⏳', accent: 'bg-amber-100 text-amber-800' },
  EM_DIAGNOSTICO: { emoji: '🩺', accent: 'bg-purple-100 text-purple-800' },
  EM_REPARACAO: { emoji: '🔧', accent: 'bg-orange-100 text-orange-800' },
  AGUARDA_MATERIAL: { emoji: '📦', accent: 'bg-red-100 text-red-800' },
  EM_INSPECCAO: { emoji: '🔎', accent: 'bg-indigo-100 text-indigo-800' },
  RESOLVIDA: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800' },
  PENDENTE: { emoji: '⏸️', accent: 'bg-gray-100 text-gray-800' },
  CANCELADA: { emoji: '✕', accent: 'bg-slate-100 text-slate-600' },
}

const PRIORITY_META: Record<string, { emoji: string; accent: string }> = {
  CRITICA: { emoji: '🔴', accent: 'bg-red-500 text-white' },
  ALTA: { emoji: '🟠', accent: 'bg-orange-500 text-white' },
  MEDIA: { emoji: '🟡', accent: 'bg-amber-400 text-white' },
  BAIXA: { emoji: '🟢', accent: 'bg-emerald-500 text-white' },
}

interface WorkOrderCardProps {
  workOrder: WorkOrder & { asset?: { description: string } }
  onClick?: () => void
}

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const status = STATUS_META[workOrder.status] || { emoji: '❔', accent: 'bg-gray-100 text-gray-800' }
  const priority = PRIORITY_META[workOrder.priority] || { emoji: '⚪', accent: 'bg-gray-400 text-white' }

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
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priority.accent}`}>
          {priority.emoji} {workOrder.priority}
        </span>
      </div>

      <div className="mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.accent}`}>
          {status.emoji} {workOrder.status}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {workOrder.asset && <p className="flex items-center gap-1.5 truncate">🚜 {workOrder.asset.description}</p>}
        <p className="flex items-center gap-1.5">🗓️ Aberto: {formatDate(workOrder.openedAt)}</p>
        {workOrder.dueAt && <p className="flex items-center gap-1.5">⏰ Prazo: {formatDate(workOrder.dueAt)}</p>}
      </div>
    </div>
  )
}

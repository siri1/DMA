import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  Wrench,
  Ban,
  CircleSlash,
  AlertTriangle,
  Trash2,
  FileText,
  Clock,
  Stethoscope,
  PackageSearch,
  ClipboardCheck,
  XCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Lock,
  Package,
  Undo2,
  Send,
  RefreshCw,
  Recycle,
  ArrowRightLeft,
  ShieldCheck,
  PlusCircle,
  Pencil,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  ClipboardList,
  Settings,
  Warehouse,
  TrendingUp,
  UserCheck,
  Tv,
} from 'lucide-react'

export interface StatusMeta {
  icon: LucideIcon
  /** text color, e.g. for a bare icon */
  text: string
  /** bg+text pill classes for a badge */
  badge: string
  label: string
}

/** Renders an icon + label pill, styled from a StatusMeta entry. */
export function StatusBadge({ meta, className = '' }: { meta: StatusMeta; className?: string }) {
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge} ${className}`}>
      <Icon size={13} strokeWidth={2.25} />
      {meta.label}
    </span>
  )
}

export const ASSET_STATUS: Record<string, StatusMeta> = {
  EM_OPERACAO: { icon: CheckCircle2, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Em Operação' },
  EM_MANUTENCAO: { icon: Wrench, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Em Manutenção' },
  INDISPONIVEL: { icon: Ban, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'Indisponível' },
  FORA_DE_SERVICO: { icon: CircleSlash, text: 'text-gray-500', badge: 'bg-gray-100 text-gray-800', label: 'Fora de Serviço' },
  QUARENTENA: { icon: AlertTriangle, text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800', label: 'Quarentena' },
  ABATIDO: { icon: Trash2, text: 'text-slate-600', badge: 'bg-slate-200 text-slate-800', label: 'Abatido' },
}

export const WORKORDER_STATUS: Record<string, StatusMeta> = {
  ABERTA: { icon: FileText, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'Aberta' },
  EM_CURSO: { icon: Clock, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Em Curso' },
  EM_DIAGNOSTICO: { icon: Stethoscope, text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800', label: 'Em Diagnóstico' },
  EM_REPARACAO: { icon: Wrench, text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800', label: 'Em Reparação' },
  AGUARDA_MATERIAL: { icon: PackageSearch, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'Aguarda Material' },
  EM_INSPECCAO: { icon: ClipboardCheck, text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800', label: 'Em Inspecção' },
  RESOLVIDA: { icon: CheckCircle2, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Resolvida' },
  PENDENTE: { icon: Clock, text: 'text-gray-500', badge: 'bg-gray-100 text-gray-800', label: 'Pendente' },
  CANCELADA: { icon: XCircle, text: 'text-slate-500', badge: 'bg-slate-100 text-slate-600', label: 'Cancelada' },
}

export const WORKORDER_PRIORITY: Record<string, StatusMeta> = {
  CRITICA: { icon: AlertTriangle, text: 'text-white', badge: 'bg-red-500 text-white', label: 'Crítica' },
  ALTA: { icon: ArrowUp, text: 'text-white', badge: 'bg-orange-500 text-white', label: 'Alta' },
  MEDIA: { icon: ArrowRight, text: 'text-white', badge: 'bg-amber-400 text-white', label: 'Média' },
  BAIXA: { icon: ArrowDown, text: 'text-white', badge: 'bg-emerald-500 text-white', label: 'Baixa' },
}

export const REQUISITION_STATUS: Record<string, StatusMeta> = {
  PENDENTE: { icon: Clock, text: 'text-gray-500', badge: 'bg-gray-100 text-gray-800', label: 'Pendente' },
  RESERVADA: { icon: Lock, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'Reservada' },
  AGUARDA_MATERIAL: { icon: Package, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Aguarda Material' },
  ENTREGUE: { icon: CheckCircle2, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Entregue' },
  DEVOLVIDA: { icon: Undo2, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'Devolvida' },
  CANCELADA: { icon: XCircle, text: 'text-gray-500', badge: 'bg-gray-200 text-gray-600', label: 'Cancelada' },
}

export const PURCHASE_ORDER_STATUS: Record<string, StatusMeta> = {
  RASCUNHO: { icon: FileText, text: 'text-gray-500', badge: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
  ENVIADA: { icon: Send, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'Enviada' },
  PARCIAL: { icon: Clock, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Parcial' },
  RECEBIDA: { icon: CheckCircle2, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Recebida' },
  CANCELADA: { icon: XCircle, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'Cancelada' },
}

export interface DecisionMeta extends StatusMeta {
  buttonClass: string
}

export const QUARANTINE_DECISION: Record<string, DecisionMeta> = {
  REPARAR: { icon: Wrench, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'Reparar', buttonClass: 'bg-blue-600 hover:bg-blue-700' },
  REAPROVEITAR: { icon: Recycle, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Reaproveitar', buttonClass: 'bg-emerald-600 hover:bg-emerald-700' },
  TRANSFERIR: { icon: ArrowRightLeft, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Transferir', buttonClass: 'bg-amber-600 hover:bg-amber-700' },
  ABATER: { icon: Trash2, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'Abater', buttonClass: 'bg-red-600 hover:bg-red-700' },
}

export const MAINTENANCE_TYPE: Record<string, StatusMeta> = {
  PREVENTIVA: { icon: ShieldCheck, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'Preventiva' },
  CORRECTIVA: { icon: Wrench, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Correctiva' },
  INSPECCAO: { icon: ClipboardCheck, text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800', label: 'Inspecção' },
}

export const INTERVENTION_RESULT: Record<string, StatusMeta> = {
  CONCLUIDA: { icon: CheckCircle2, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Concluída' },
  PENDENTE: { icon: Clock, text: 'text-gray-500', badge: 'bg-gray-100 text-gray-800', label: 'Pendente' },
  REQUER_NOVA: { icon: RefreshCw, text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Requer Nova Intervenção' },
}

export const AUDIT_ACTION: Record<string, StatusMeta> = {
  CREATE: { icon: PlusCircle, text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'CREATE' },
  UPDATE: { icon: Pencil, text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', label: 'UPDATE' },
  DELETE: { icon: Trash2, text: 'text-red-600', badge: 'bg-red-100 text-red-800', label: 'DELETE' },
  STATE_CHANGE: { icon: RefreshCw, text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800', label: 'STATE_CHANGE' },
}

export const STOCK_MOVEMENT_TYPE: Record<string, StatusMeta> = {
  ENTRADA: { icon: ArrowDownCircle, text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', label: 'Entrada' },
  SAIDA: { icon: ArrowUpCircle, text: 'text-red-700', badge: 'bg-red-100 text-red-800', label: 'Saída' },
  RESERVA: { icon: Lock, text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', label: 'Reserva' },
  DEVOLUCAO: { icon: Undo2, text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', label: 'Devolução' },
  TRANSFERENCIA: { icon: ArrowRightLeft, text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800', label: 'Transferência' },
  AJUSTE: { icon: Scale, text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', label: 'Ajuste' },
  INVENTARIO: { icon: ClipboardList, text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800', label: 'Inventário' },
}

export const USER_ROLE: Record<string, StatusMeta> = {
  ADMIN: { icon: Settings, text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800', label: 'Administrador' },
  OFICINA: { icon: Wrench, text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', label: 'Oficina' },
  ARMAZEM: { icon: Warehouse, text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', label: 'Armazém' },
  GESTAO: { icon: TrendingUp, text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', label: 'Gestão' },
  CLIENTE_INTERNO: { icon: UserCheck, text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', label: 'Cliente Interno' },
  PAINEL: { icon: Tv, text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800', label: 'Painel' },
}

export const FALLBACK_META: StatusMeta = {
  icon: FileText,
  text: 'text-gray-500',
  badge: 'bg-gray-100 text-gray-700',
  label: '',
}

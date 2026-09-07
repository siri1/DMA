'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/formatters'
import { WORKORDER_STATUS, FALLBACK_META } from '@/lib/status-icons'
import {
  TrendingUp,
  XCircle,
  Sparkles,
  CalendarClock,
  Package,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Clock,
  History,
  ArrowRight,
  Boxes,
} from 'lucide-react'

interface EquipmentStatusRow {
  workOrderId: string
  assetId: string
  assetCode: string
  description: string
  brand: string | null
  model: string | null
  summary: string
  daysOpen: number
}

interface EquipmentStatusBoard {
  totalAssets: number
  emReparacaoCount: number
  aguardaMaterialCount: number
  availableCount: number
  oldestOpen: EquipmentStatusRow | null
  emReparacao: EquipmentStatusRow[]
  aguardaMaterial: EquipmentStatusRow[]
}

interface OperationalMetrics {
  overdueWorkOrders: Array<{ id: string; number: string; summary: string; dueAt: string; asset: { assetCode: string } }>
  overdueMaintenancePlans: Array<{ id: string; nextDueAt: string; asset: { assetCode: string; description: string } }>
  lowStockItems: Array<{ id: string; sku: string; description: string; minStock: number; currentQty: number; deficit: number }>
}

const REFRESH_MS = 30000

function EquipmentTable({ rows }: { rows: EquipmentStatusRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 flex items-center gap-2 px-6 py-8"><Sparkles size={15} /> Sem equipamentos nesta categoria</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left py-2.5 px-4 font-semibold">Asset</th>
            <th className="text-left py-2.5 px-2 font-semibold">Equipamento</th>
            <th className="text-left py-2.5 px-2 font-semibold hidden md:table-cell">Marca / Modelo</th>
            <th className="text-left py-2.5 px-2 font-semibold">Descrição da Avaria</th>
            <th className="text-right py-2.5 px-4 font-semibold">Dias em Aberto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.workOrderId} className="border-b border-gray-50 hover:bg-gray-50/70">
              <td className="py-3 px-4 font-mono text-xs font-medium text-gray-900">{row.assetCode}</td>
              <td className="py-3 px-2 text-gray-800">{row.description}</td>
              <td className="py-3 px-2 text-gray-500 hidden md:table-cell">{[row.brand, row.model].filter(Boolean).join(' ') || '—'}</td>
              <td className="py-3 px-2 text-gray-600 max-w-[220px] truncate" title={row.summary}>{row.summary}</td>
              <td className="py-3 px-4 text-right font-bold text-gray-900">{row.daysOpen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OperationalDashboard() {
  const [board, setBoard] = useState<EquipmentStatusBoard | null>(null)
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const load = useCallback(async () => {
    const [boardRes, metricsRes] = await Promise.all([
      fetch('/api/dashboard/equipment-status'),
      fetch('/api/dashboard/metrics?type=operational'),
    ])
    if (boardRes.ok) setBoard(await boardRes.json())
    if (metricsRes.ok) setMetrics(await metricsRes.json())
    setLoading(false)
    setNow(new Date())
  }, [])

  useEffect(() => {
    load()
    const dataTimer = setInterval(load, REFRESH_MS)
    const clockTimer = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(dataTimer)
      clearInterval(clockTimer)
    }
  }, [load])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <TrendingUp size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar métricas...</p>
        </div>
      </div>
    )
  }
  if (!board || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">
          <XCircle size={40} className="mx-auto mb-3" />
          <p className="text-sm">Erro ao carregar dados</p>
        </div>
      </div>
    )
  }

  const emReparacaoMeta = WORKORDER_STATUS.EM_REPARACAO || FALLBACK_META
  const aguardaMeta = WORKORDER_STATUS.AGUARDA_MATERIAL || FALLBACK_META
  const resolvidaMeta = WORKORDER_STATUS.RESOLVIDA || FALLBACK_META
  const canceladaMeta = WORKORDER_STATUS.CANCELADA || FALLBACK_META
  const EmReparacaoIcon = emReparacaoMeta.icon
  const AguardaIcon = aguardaMeta.icon
  const ResolvidaIcon = resolvidaMeta.icon
  const CanceladaIcon = canceladaMeta.icon

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/kwanda-logo.jpg" alt="KWANDA, Lda." className="h-12 w-12 rounded-lg object-cover shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Oficina — Equipamentos Não Resolvidos</h1>
        </div>
        <div className="flex items-center gap-2 text-right shrink-0">
          <Clock size={22} className="text-white/60" />
          <div>
            <p className="text-lg font-bold tabular-nums leading-tight">{now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs text-white/60">{now.toLocaleDateString('pt-PT')}</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            <Boxes size={15} /> Total de Equipamentos
          </div>
          <p className="text-3xl font-bold text-gray-900">{board.totalAssets}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wide mb-2">
            <Wrench size={15} /> Em Reparação <span className="text-gray-400 font-normal normal-case">(Em Curso)</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{board.emReparacaoCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wide mb-2">
            <Package size={15} /> Aguarda Material <span className="text-gray-400 font-normal normal-case">(Pendente)</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{board.aguardaMaterialCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-2">
            <CheckCircle2 size={15} /> Disponíveis <span className="text-gray-400 font-normal normal-case">(Resolvidos)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{board.availableCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            <CalendarClock size={15} /> Máquina Mais Antiga em Aberto
          </div>
          {board.oldestOpen ? (
            <>
              <p className="text-base font-bold text-gray-900 truncate">{board.oldestOpen.assetCode}</p>
              <p className="text-xs text-gray-500 truncate">{[board.oldestOpen.brand, board.oldestOpen.model].filter(Boolean).join(' ') || board.oldestOpen.description}</p>
              <p className="text-xs font-medium text-gray-700 mt-1">{board.oldestOpen.daysOpen} dias em aberto</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Nenhum equipamento em aberto</p>
          )}
        </div>
      </div>

      {/* Two-column equipment tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Wrench size={17} /> Em Reparação (Em Curso)
            </h2>
            <span className="text-sm font-medium bg-white/20 px-2.5 py-0.5 rounded-full">{board.emReparacaoCount} equipamentos</span>
          </div>
          <EquipmentTable rows={board.emReparacao} />
          <Link
            href="/oficina/workorders"
            className="flex items-center justify-between px-6 py-3 text-sm font-medium text-red-700 bg-red-50/50 hover:bg-red-50 transition-colors"
          >
            Ver todos os {board.emReparacaoCount} equipamentos em reparação <ArrowRight size={15} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Package size={17} /> Aguarda Material (Pendente)
            </h2>
            <span className="text-sm font-medium bg-white/20 px-2.5 py-0.5 rounded-full">{board.aguardaMaterialCount} equipamentos</span>
          </div>
          <EquipmentTable rows={board.aguardaMaterial} />
          <Link
            href="/oficina/workorders"
            className="flex items-center justify-between px-6 py-3 text-sm font-medium text-amber-700 bg-amber-50/50 hover:bg-amber-50 transition-colors"
          >
            Ver todos os {board.aguardaMaterialCount} equipamentos pendentes <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Legend + last updated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legenda de Estado</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className={`flex items-center gap-1.5 ${emReparacaoMeta.text}`}><EmReparacaoIcon size={15} /> Em Reparação</span>
            <span className={`flex items-center gap-1.5 ${aguardaMeta.text}`}><AguardaIcon size={15} /> Aguarda Material</span>
            <span className={`flex items-center gap-1.5 ${resolvidaMeta.text}`}><ResolvidaIcon size={15} /> Disponível</span>
            <span className={`flex items-center gap-1.5 ${canceladaMeta.text}`}><CanceladaIcon size={15} /> Resolvido / Cancelado</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Última Actualização</p>
            <p className="text-gray-800 font-medium">{now.toLocaleDateString('pt-PT')} · {now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fonte de Dados</p>
            <p className="text-gray-800 font-medium">Sistema da Oficina</p>
          </div>
        </div>
      </div>

      {/* Supplementary operational metrics */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Outras Métricas Operacionais</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertOctagon size={18} className="text-red-500" /> Ordens Atrasadas <span className="text-xs font-normal text-gray-400">({metrics.overdueWorkOrders.length})</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.overdueWorkOrders.length === 0 ? (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles size={15} /> Sem ordens atrasadas
                </p>
              ) : (
                metrics.overdueWorkOrders.map((wo) => (
                  <div key={wo.id} className="p-3 bg-red-50 rounded-xl ring-1 ring-red-100">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-red-900 text-sm">{wo.number}</p>
                        <p className="text-sm text-gray-600 truncate">{wo.asset.assetCode} — {wo.summary}</p>
                      </div>
                      <p className="text-xs text-gray-500 shrink-0">{formatDateTime(new Date(wo.dueAt))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarClock size={18} className="text-amber-500" /> Manutenções Vencidas <span className="text-xs font-normal text-gray-400">({metrics.overdueMaintenancePlans.length})</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.overdueMaintenancePlans.length === 0 ? (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles size={15} /> Sem manutenções vencidas
                </p>
              ) : (
                metrics.overdueMaintenancePlans.map((mp) => (
                  <div key={mp.id} className="p-3 bg-amber-50 rounded-xl ring-1 ring-amber-100">
                    <p className="font-medium text-amber-900 text-sm">{mp.asset.assetCode}</p>
                    <p className="text-sm text-gray-600">{mp.asset.description}</p>
                    <p className="text-xs text-gray-500">Vencida em {formatDateTime(new Date(mp.nextDueAt))}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History size={18} className="text-orange-500" /> Artigos Abaixo do Mínimo <span className="text-xs font-normal text-gray-400">({metrics.lowStockItems.length})</span>
            </h3>
            {metrics.lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Sparkles size={15} /> Todos os artigos acima do mínimo
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="text-left py-2 font-medium">SKU</th>
                      <th className="text-left py-2 font-medium">Descrição</th>
                      <th className="text-right py-2 font-medium">Stock Actual</th>
                      <th className="text-right py-2 font-medium">Mínimo</th>
                      <th className="text-right py-2 font-medium">Falta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.lowStockItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 font-medium text-red-600">{item.sku}</td>
                        <td className="py-2.5">{item.description}</td>
                        <td className="text-right py-2.5">{item.currentQty}</td>
                        <td className="text-right py-2.5">{item.minStock}</td>
                        <td className="text-right py-2.5 font-bold text-red-600">{item.deficit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

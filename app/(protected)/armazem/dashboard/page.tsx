'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { REQUISITION_STATUS, PURCHASE_ORDER_STATUS, STOCK_MOVEMENT_TYPE, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Archive,
  AlertTriangle,
  PackageX,
  PackageSearch,
  Receipt,
  Truck,
  Building2,
  History,
} from 'lucide-react'

interface LowStockRow {
  id: string
  sku: string
  description: string
  currentQty: number
  minStock: number
  deficit: number
}

interface PendingRequisitionRow {
  id: string
  status: string
  createdAt: string
  workOrderNumber: string
  lineCount: number
}

interface OpenPurchaseOrderRow {
  id: string
  status: string
  createdAt: string
  supplierName: string
  lineCount: number
  totalValue: number
}

interface RecentMovementRow {
  id: string
  type: string
  qty: number
  createdAt: string
  itemSku: string
  itemDescription: string
}

interface PartsDashboardMetrics {
  totalInventoryValue: number
  slowMovingValue: number
  deadStockValue: number
  lowStockCount: number
  outOfStockCount: number
  actionableRequisitionsCount: number
  draftPurchaseOrdersCount: number
  sentPurchaseOrdersCount: number
  partialReceiptsCount: number
  activeSuppliersCount: number
  lowStockItems: LowStockRow[]
  pendingRequisitions: PendingRequisitionRow[]
  openPurchaseOrders: OpenPurchaseOrderRow[]
  recentMovements: RecentMovementRow[]
}

export default function PartsDashboardPage() {
  const [metrics, setMetrics] = useState<PartsDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/parts')
        if (res.ok) setMetrics(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <LayoutDashboard size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar dashboard...</p>
        </div>
      </div>
    )
  }
  if (!metrics) return <div className="p-8">Erro ao carregar dados</div>

  const kpis = [
    { label: 'Valor Total em Stock', value: formatCurrency(metrics.totalInventoryValue), icon: Wallet, accent: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { label: 'Rotação Lenta', value: formatCurrency(metrics.slowMovingValue), icon: TrendingDown, accent: 'text-amber-600 bg-amber-50 ring-amber-100' },
    { label: 'Stock Morto', value: formatCurrency(metrics.deadStockValue), icon: Archive, accent: 'text-red-600 bg-red-50 ring-red-100' },
    { label: 'Artigos Abaixo do Mínimo', value: metrics.lowStockCount, icon: AlertTriangle, accent: 'text-orange-600 bg-orange-50 ring-orange-100' },
    { label: 'Artigos Esgotados', value: metrics.outOfStockCount, icon: PackageX, accent: 'text-red-600 bg-red-50 ring-red-100' },
    { label: 'Requisições a Aguardar Acção', value: metrics.actionableRequisitionsCount, icon: PackageSearch, accent: 'text-blue-600 bg-blue-50 ring-blue-100' },
    { label: 'Encomendas em Rascunho', value: metrics.draftPurchaseOrdersCount, icon: Receipt, accent: 'text-gray-600 bg-gray-50 ring-gray-100' },
    { label: 'Encomendas Enviadas', value: metrics.sentPurchaseOrdersCount, icon: Truck, accent: 'text-indigo-600 bg-indigo-50 ring-indigo-100' },
    { label: 'Recepções Parciais', value: metrics.partialReceiptsCount, icon: Truck, accent: 'text-purple-600 bg-purple-50 ring-purple-100' },
    { label: 'Fornecedores Activos', value: metrics.activeSuppliersCount, icon: Building2, accent: 'text-slate-600 bg-slate-50 ring-slate-100' },
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard size={28} /> Dashboard de Peças
        </h1>
        <p className="text-gray-500 text-sm mt-1">Visão consolidada de stock, requisições, compras e recepções</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 shrink-0 ${kpi.accent}`}>
              <kpi.icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 leading-tight truncate">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} /> Artigos Abaixo do Mínimo
            </h2>
            <Link href="/armazem/inventory" className="text-xs text-amber-700 hover:underline">Ver todos →</Link>
          </div>
          {metrics.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Nenhum artigo abaixo do mínimo</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {metrics.lowStockItems.map((item) => (
                <Link key={item.id} href={`/armazem/inventory/${item.id}`} className="flex justify-between items-center px-6 py-3 hover:bg-gray-50/70 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.sku} — {item.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Actual: {item.currentQty} · Mínimo: {item.minStock}</p>
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full shrink-0 ml-3">
                    Falta {item.deficit}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <PackageSearch size={18} /> Requisições a Aguardar Acção
            </h2>
            <Link href="/armazem/requisitions" className="text-xs text-amber-700 hover:underline">Ver todas →</Link>
          </div>
          {metrics.pendingRequisitions.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Nenhuma requisição pendente</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {metrics.pendingRequisitions.map((req) => {
                const meta = REQUISITION_STATUS[req.status] || { ...FALLBACK_META, label: req.status }
                return (
                  <Link key={req.id} href={`/armazem/requisitions/${req.id}`} className="flex justify-between items-center px-6 py-3 hover:bg-gray-50/70 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">OT: {req.workOrderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{req.lineCount} item(ns) — {formatDateTime(new Date(req.createdAt))}</p>
                    </div>
                    <StatusBadge meta={meta} className="shrink-0 ml-3" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Receipt size={18} /> Encomendas em Aberto
            </h2>
            <Link href="/armazem/purchases" className="text-xs text-amber-700 hover:underline">Ver todas →</Link>
          </div>
          {metrics.openPurchaseOrders.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Nenhuma encomenda em aberto</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {metrics.openPurchaseOrders.map((po) => {
                const meta = PURCHASE_ORDER_STATUS[po.status] || { ...FALLBACK_META, label: po.status }
                return (
                  <div key={po.id} className="flex justify-between items-center px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{po.supplierName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{po.lineCount} linha(s) — {formatCurrency(po.totalValue)}</p>
                    </div>
                    <StatusBadge meta={meta} className="shrink-0 ml-3" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <History size={18} /> Movimentos Recentes
            </h2>
          </div>
          {metrics.recentMovements.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Sem movimentos registados</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {metrics.recentMovements.map((m) => {
                const meta = STOCK_MOVEMENT_TYPE[m.type] || { ...FALLBACK_META, label: m.type }
                const Icon = meta.icon
                return (
                  <div key={m.id} className="flex justify-between items-center px-6 py-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium flex items-center gap-1.5 ${meta.text}`}>
                        <Icon size={13} /> {m.itemSku} — {m.itemDescription}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{meta.label} · {m.qty} un.</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{formatDateTime(new Date(m.createdAt))}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

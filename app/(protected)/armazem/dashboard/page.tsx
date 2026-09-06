'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
} from 'lucide-react'

// Validated categorical/status colors — see docs/ASSUMPTIONS.md 5.6.
// Movements-by-type is a single series (one measure, nominal categories), so
// every bar takes the same categorical slot-1 hue rather than a different
// color per bar (color would just be re-encoding what the bar length already
// shows). The rotation pie IS a health scale (good → warning → critical), so
// it wears the reserved status palette instead of categorical hues.
const CHART_SERIES_BLUE = '#2a78d6'
const STATUS_GOOD = '#0ca30c'
const STATUS_WARNING = '#fab219'
const STATUS_CRITICAL = '#d03b3b'

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

interface MovementTypeCount {
  type: string
  count: number
}

interface StockRotation {
  fastMovingValue: number
  slowMovingOnlyValue: number
  deadStockValue: number
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
  movementsByType: MovementTypeCount[]
  stockRotation: StockRotation
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

  const movementChartData = metrics.movementsByType.map((m) => ({
    name: (STOCK_MOVEMENT_TYPE[m.type] || { ...FALLBACK_META, label: m.type }).label,
    count: m.count,
  }))

  const rotationTotal =
    metrics.stockRotation.fastMovingValue + metrics.stockRotation.slowMovingOnlyValue + metrics.stockRotation.deadStockValue

  const rotationChartData = [
    { name: 'Rotação Normal', value: metrics.stockRotation.fastMovingValue, color: STATUS_GOOD, icon: CheckCircle2 },
    { name: 'Rotação Lenta', value: metrics.stockRotation.slowMovingOnlyValue, color: STATUS_WARNING, icon: TrendingDown },
    { name: 'Stock Morto', value: metrics.stockRotation.deadStockValue, color: STATUS_CRITICAL, icon: Archive },
  ].filter((slice) => slice.value > 0)

  const pctOf = (value: number) => (rotationTotal > 0 ? Math.round((value / rotationTotal) * 100) : 0)

  // Percentage labels render outside the ring (neutral text on the card
  // background) rather than inside the colored fill - the warning slice
  // (#fab219) is too light for reliable text-on-fill contrast, and this
  // sidesteps picking white-vs-ink per slice entirely.
  const RADIAN = Math.PI / 180
  const renderRotationLabel = (props: {
    cx: number
    cy: number
    midAngle: number
    outerRadius: number
    value: number
  }) => {
    const { cx, cy, midAngle, outerRadius, value } = props
    const radius = outerRadius + 18
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#374151" fontSize={12} fontWeight={600} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {pctOf(value)}%
      </text>
    )
  }

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
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart3 size={18} /> Movimentos de Stock por Tipo
          </h2>
          <p className="text-xs text-gray-400 mb-4">Últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={movementChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: number) => [`${value}`, 'Movimentos']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="count" name="Movimentos" fill={CHART_SERIES_BLUE} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <PieChartIcon size={18} /> Composição do Stock por Rotação
          </h2>
          <p className="text-xs text-gray-400 mb-4">Por valor, ao custo médio ponderado</p>
          {rotationTotal === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Sem stock valorizado para analisar</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={rotationChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={renderRotationLabel}
                    labelLine={{ stroke: '#d1d5db' }}
                  >
                    {rotationChartData.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {rotationChartData.map((slice) => (
                  <div key={slice.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <slice.icon size={13} style={{ color: slice.color }} />
                    {slice.name} — {formatCurrency(slice.value)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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

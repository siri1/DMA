'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { STOCK_MOVEMENT_TYPE, FALLBACK_META } from '@/lib/status-icons'

// Mirrors modules/inventory/optimization.ts thresholds (kept as literals here
// to avoid bundling the server-only Prisma-backed module into the client).
const SLOW_MOVING_DAYS = 90
const DEAD_STOCK_DAYS = 180
import {
  Package,
  Building2,
  Ruler,
  Wallet,
  Barcode,
  History,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Gauge,
  Loader2,
  Sparkles,
} from 'lucide-react'

interface StockBalance {
  id: string
  qty: number
  location: { code: string; warehouse: string }
}

interface StockMovement {
  id: string
  type: string
  qty: number
  unitCost: string | number
  createdAt: string
}

interface ItemDetail {
  id: string
  sku: string
  description: string
  brand: string | null
  unit: string
  minStock: number
  maxStock: number
  avgCost: string | number | null
  barcode: string | null
  active: boolean
  stockBalances: StockBalance[]
  stockMovements: StockMovement[]
}

interface ItemOptimization {
  currentQty: number
  inventoryValue: number
  avgDailyUsage: number
  daysOfSupply: number | null
  daysSinceLastOutMovement: number | null
  isSlowMoving: boolean
  isDeadStock: boolean
  leadTimeDays: number | null
  recommendedReorderPoint: number | null
  recommendedMaxStock: number | null
  currentMinStock: number
  currentMaxStock: number
}

export default function ItemDetailPage() {
  const params = useParams()
  const itemId = params.id as string

  const [item, setItem] = useState<ItemDetail | null>(null)
  const [optimization, setOptimization] = useState<ItemOptimization | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  const load = async () => {
    try {
      const [itemRes, optRes] = await Promise.all([
        fetch(`/api/inventory/items/${itemId}`),
        fetch(`/api/inventory/items/${itemId}/optimization`),
      ])
      if (itemRes.ok) setItem(await itemRes.json())
      if (optRes.ok) setOptimization(await optRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const applyRecommendation = async () => {
    if (!optimization?.recommendedReorderPoint || !optimization.recommendedMaxStock) return
    setApplying(true)
    try {
      const res = await fetch(`/api/inventory/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minStock: optimization.recommendedReorderPoint,
          maxStock: optimization.recommendedMaxStock,
        }),
      })
      if (res.ok) await load()
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <Package size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }
  if (!item) return <div className="p-8">Artigo não encontrado</div>

  const totalQty = item.stockBalances.reduce((sum, b) => sum + b.qty, 0)
  const belowMin = totalQty < item.minStock

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package size={28} /> {item.sku}
          </h1>
          <p className="text-gray-500 mt-1">{item.description}</p>
        </div>
        {item.active ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={14} /> Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
            <Circle size={14} /> Inactivo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} /> Detalhes
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1"><Building2 size={12} /> Marca</dt>
                <dd className="text-gray-800 mt-0.5">{item.brand || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1"><Ruler size={12} /> Unidade</dt>
                <dd className="text-gray-800 mt-0.5">{item.unit}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1"><Wallet size={12} /> Custo Médio</dt>
                <dd className="text-gray-800 mt-0.5">{item.avgCost != null ? formatCurrency(Number(item.avgCost)) : '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1"><Barcode size={12} /> Código de Barras</dt>
                <dd className="text-gray-800 mt-0.5">{item.barcode || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History size={18} /> Movimentos Recentes
            </h2>
            {item.stockMovements.length === 0 ? (
              <p className="text-sm text-gray-400">Sem movimentos registados</p>
            ) : (
              <div className="space-y-2">
                {item.stockMovements.map((m) => {
                  const meta = STOCK_MOVEMENT_TYPE[m.type] || { ...FALLBACK_META, label: m.type }
                  const Icon = meta.icon
                  return (
                    <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                      <span className={`flex items-center gap-2 font-medium ${meta.text}`}>
                        <Icon size={14} /> {meta.label} — {m.qty} {item.unit}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(new Date(m.createdAt))}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl p-5 ring-1 ${belowMin ? 'bg-red-50 ring-red-100' : 'bg-emerald-50 ring-emerald-100'}`}>
            <p className="text-xs font-medium opacity-75 flex items-center gap-1.5">
              {belowMin ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />} {belowMin ? 'Stock Abaixo do Mínimo' : 'Stock Total'}
            </p>
            <p className="text-3xl font-bold mt-1">{totalQty} <span className="text-base font-medium">{item.unit}</span></p>
            <p className="text-xs text-gray-500 mt-2">Mín: {item.minStock} · Máx: {item.maxStock}</p>
          </div>

          {optimization && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gauge size={18} /> Optimização de Stock
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Consumo médio diário</dt>
                  <dd className="font-medium text-gray-900">{optimization.avgDailyUsage.toFixed(2)} {item.unit}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Dias de Cobertura</dt>
                  <dd className="font-medium text-gray-900">
                    {optimization.daysOfSupply !== null ? `${optimization.daysOfSupply} dias` : 'Sem consumo recente'}
                  </dd>
                </div>
                {optimization.leadTimeDays !== null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Prazo de Entrega (Fornecedor)</dt>
                    <dd className="font-medium text-gray-900">{optimization.leadTimeDays} dias</dd>
                  </div>
                )}
              </dl>

              {optimization.isDeadStock && (
                <p className="mt-4 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Stock morto — sem saídas há mais de {DEAD_STOCK_DAYS} dias
                </p>
              )}
              {!optimization.isDeadStock && optimization.isSlowMoving && (
                <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Rotação lenta — sem saídas há mais de {SLOW_MOVING_DAYS} dias
                </p>
              )}

              {optimization.recommendedReorderPoint !== null && optimization.recommendedMaxStock !== null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recomendação</p>
                  <p className="text-sm text-gray-700">
                    Mín: <strong>{optimization.recommendedReorderPoint}</strong> · Máx:{' '}
                    <strong>{optimization.recommendedMaxStock}</strong>
                  </p>
                  {(optimization.recommendedReorderPoint !== optimization.currentMinStock ||
                    optimization.recommendedMaxStock !== optimization.currentMaxStock) && (
                    <button
                      onClick={applyRecommendation}
                      disabled={applying}
                      className="mt-3 w-full py-2 px-3 bg-amber-700 text-white text-sm font-medium rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {applying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Aplicar Recomendação
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} /> Por Localização
            </h2>
            {item.stockBalances.length === 0 ? (
              <p className="text-sm text-gray-400">Sem stock em nenhuma localização</p>
            ) : (
              <div className="space-y-2">
                {item.stockBalances.map((b) => (
                  <div key={b.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-mono text-xs">{b.location.code}</span>
                    <span className="font-medium text-gray-900">{b.qty} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

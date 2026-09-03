'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

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

const MOVEMENT_META: Record<string, { emoji: string; accent: string }> = {
  ENTRADA: { emoji: '⬇️', accent: 'text-emerald-700' },
  SAIDA: { emoji: '⬆️', accent: 'text-red-700' },
  RESERVA: { emoji: '🔒', accent: 'text-blue-700' },
  DEVOLUCAO: { emoji: '↩️', accent: 'text-purple-700' },
  TRANSFERENCIA: { emoji: '🔀', accent: 'text-indigo-700' },
  AJUSTE: { emoji: '⚖️', accent: 'text-amber-700' },
  INVENTARIO: { emoji: '🔢', accent: 'text-gray-700' },
}

export default function ItemDetailPage() {
  const params = useParams()
  const itemId = params.id as string

  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/inventory/items/${itemId}`)
        if (res.ok) setItem(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">📦</div>
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }
  if (!item) return <div className="p-8">❌ Artigo não encontrado</div>

  const totalQty = item.stockBalances.reduce((sum, b) => sum + b.qty, 0)
  const belowMin = totalQty < item.minStock

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>📦</span> {item.sku}
          </h1>
          <p className="text-gray-500 mt-1">{item.description}</p>
        </div>
        {item.active ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            🟢 Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
            ⚪ Inactivo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">📋 Detalhes</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🏭 Marca</dt><dd className="text-gray-800 mt-0.5">{item.brand || '—'}</dd></div>
              <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">📏 Unidade</dt><dd className="text-gray-800 mt-0.5">{item.unit}</dd></div>
              <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">💰 Custo Médio</dt><dd className="text-gray-800 mt-0.5">{item.avgCost != null ? formatCurrency(Number(item.avgCost)) : '—'}</dd></div>
              <div><dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">🔖 Código de Barras</dt><dd className="text-gray-800 mt-0.5">{item.barcode || '—'}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📜 Movimentos Recentes
            </h2>
            {item.stockMovements.length === 0 ? (
              <p className="text-sm text-gray-400">Sem movimentos registados</p>
            ) : (
              <div className="space-y-2">
                {item.stockMovements.map((m) => {
                  const meta = MOVEMENT_META[m.type] || { emoji: '•', accent: 'text-gray-700' }
                  return (
                    <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                      <span className={`flex items-center gap-2 font-medium ${meta.accent}`}>
                        {meta.emoji} {m.type} — {m.qty} {item.unit}
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
            <p className="text-xs font-medium opacity-75">{belowMin ? '🚨 Stock Abaixo do Mínimo' : '✅ Stock Total'}</p>
            <p className="text-3xl font-bold mt-1">{totalQty} <span className="text-base font-medium">{item.unit}</span></p>
            <p className="text-xs text-gray-500 mt-2">Mín: {item.minStock} · Máx: {item.maxStock}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">📍 Por Localização</h2>
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'
import { Package, Plus, AlertTriangle, TrendingDown, Search, Wallet, Archive } from 'lucide-react'

interface ItemRow {
  id: string
  sku: string
  description: string
  minStock: number
  maxStock: number
  avgCost: number | string
}

interface OptimizationSummary {
  totalInventoryValue: number
  slowMovingValue: number
  deadStockValue: number
  flaggedItems: { itemId: string; sku: string; description: string; value: number }[]
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [lowStock, setLowStock] = useState<ItemRow[]>([])
  const [optimization, setOptimization] = useState<OptimizationSummary | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, lowRes, optRes] = await Promise.all([
          fetch('/api/inventory/items'),
          fetch('/api/inventory/low-stock'),
          fetch('/api/inventory/optimization-summary'),
        ])

        if (itemsRes.ok) setItems(await itemsRes.json())
        if (lowRes.ok) setLowStock(await lowRes.json())
        if (optRes.ok) setOptimization(await optRes.json())
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredItems = items.filter(
    (item) =>
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <Package size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar inventário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package size={28} /> Stocks e Artigos
        </h1>
        <Link
          href="/armazem/inventory/new"
          className="px-4 py-2.5 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 shadow-sm shadow-amber-700/20 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Novo Artigo
        </Link>
      </div>

      {optimization && optimization.totalInventoryValue > 0 && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Wallet size={13} /> Valor Total em Stock
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(optimization.totalInventoryValue)}</p>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl ring-1 ring-amber-100">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingDown size={13} /> Stock de Rotação Lenta (&gt;{90}d)
            </p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(optimization.slowMovingValue)}</p>
          </div>
          <div className="p-5 bg-red-50 rounded-2xl ring-1 ring-red-100">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wide flex items-center gap-1.5">
              <Archive size={13} /> Stock Morto (&gt;{180}d)
            </p>
            <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(optimization.deadStockValue)}</p>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="mb-8 p-5 bg-amber-50 ring-1 ring-amber-100 rounded-2xl">
          <h2 className="text-base font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> {lowStock.length} Artigo(s) Abaixo do Mínimo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item) => (
              <Link
                key={item.id}
                href={`/armazem/inventory/${item.id}`}
                className="p-3 bg-white rounded-xl ring-1 ring-amber-100 hover:shadow-md transition-all"
              >
                <p className="font-medium text-gray-900">{item.sku}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <TrendingDown size={12} /> Stock baixo — mín: {item.minStock}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Procurar por SKU ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mín/Máx</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Custo Médio</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{item.sku}</td>
                <td className="px-6 py-4 text-gray-700">{item.description}</td>
                <td className="px-6 py-4 text-gray-500">{item.minStock} / {item.maxStock}</td>
                <td className="px-6 py-4 text-gray-700">{formatCurrency(Number(item.avgCost))}</td>
                <td className="px-6 py-4">
                  <Link href={`/armazem/inventory/${item.id}`} className="text-amber-700 hover:text-amber-900 font-medium">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">Nenhum artigo encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

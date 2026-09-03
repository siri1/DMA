'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

interface ItemRow {
  id: string
  sku: string
  description: string
  minStock: number
  maxStock: number
  avgCost: number | string
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [lowStock, setLowStock] = useState<ItemRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, lowRes] = await Promise.all([
          fetch('/api/inventory/items'),
          fetch('/api/inventory/low-stock'),
        ])

        if (itemsRes.ok) setItems(await itemsRes.json())
        if (lowRes.ok) setLowStock(await lowRes.json())
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
          <div className="text-4xl mb-3 animate-pulse">📦</div>
          <p className="text-sm">A carregar inventário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span>📦</span> Stocks e Artigos
        </h1>
        <Link
          href="/armazem/inventory/new"
          className="px-4 py-2.5 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 shadow-sm shadow-amber-700/20 transition-colors"
        >
          ➕ Novo Artigo
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-8 p-5 bg-amber-50 ring-1 ring-amber-100 rounded-2xl">
          <h2 className="text-base font-semibold text-amber-900 mb-4 flex items-center gap-2">
            🚨 {lowStock.length} Artigo(s) Abaixo do Mínimo
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
                  📉 Stock baixo — mín: {item.minStock}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔎 Procurar por SKU ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
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

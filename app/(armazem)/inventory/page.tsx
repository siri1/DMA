'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
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

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventário</h1>
        <Link
          href="/armazem/inventory/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Novo Artigo
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">
            ⚠️ {lowStock.length} Artigo(s) Abaixo do Mínimo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item) => (
              <Link
                key={item.id}
                href={`/armazem/inventory/${item.id}`}
                className="p-3 bg-white border-l-4 border-yellow-500 rounded hover:shadow transition"
              >
                <p className="font-medium text-gray-900">{item.sku}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Stock baixo — mín: {item.minStock}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Procurar por SKU ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">SKU</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Descrição</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Stock Total</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Mín/Máx</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Custo Médio</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Acção</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{item.sku}</td>
                <td className="px-6 py-4 text-gray-600">{item.description}</td>
                <td className="px-6 py-4 text-gray-600">—</td>
                <td className="px-6 py-4 text-gray-600">
                  {item.minStock}/{item.maxStock}
                </td>
                <td className="px-6 py-4 text-gray-600">{formatCurrency(item.avgCost)}</td>
                <td className="px-6 py-4">
                  <Link
                    href={`/armazem/inventory/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

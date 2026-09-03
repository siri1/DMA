'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'

interface Line {
  itemId: string
  qtyReceived: number
}

interface ItemOption {
  id: string
  sku: string
  description: string
  unit: string
}

interface ReceiptRow {
  id: string
  status: string
  createdAt: string
  lines: { id: string; itemId: string; qtyReceived: number; item: ItemOption | null }[]
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([])
  const [items, setItems] = useState<ItemOption[]>([])
  const [lines, setLines] = useState<Line[]>([{ itemId: '', qtyReceived: 1 }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [rRes, iRes] = await Promise.all([
      fetch('/api/receipts'),
      fetch('/api/inventory/items'),
    ])
    if (rRes.ok) setReceipts(await rRes.json())
    if (iRes.ok) setItems(await iRes.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const valid = lines.filter((l) => l.itemId && l.qtyReceived > 0)
      if (valid.length === 0) {
        setError('Adicione pelo menos um artigo.')
        return
      }
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: valid }),
      })
      if (!res.ok) {
        setError('Erro ao registar recepção.')
        return
      }
      setLines([{ itemId: '', qtyReceived: 1 }])
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Recepção e Conferência</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Nova Recepção</h2>
          {error && <div className="p-3 bg-red-100 text-red-800 rounded text-sm">{error}</div>}

          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={line.itemId}
                onChange={(e) => {
                  const next = [...lines]
                  next[i] = { ...next[i], itemId: e.target.value }
                  setLines(next)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Artigo...</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.sku} — {it.description}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={line.qtyReceived}
                onChange={(e) => {
                  const next = [...lines]
                  next[i] = { ...next[i], qtyReceived: parseInt(e.target.value) || 0 }
                  setLines(next)
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setLines([...lines, { itemId: '', qtyReceived: 1 }])}
            className="text-sm text-blue-600 hover:underline"
          >
            + Adicionar linha
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'A registar...' : 'Registar Recepção'}
          </button>
        </form>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recepções ({receipts.length})
          </h2>
          <div className="space-y-3">
            {receipts.map((r) => (
              <div key={r.id} className="p-4 bg-white rounded-lg shadow border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{r.status}</span>
                  <span className="text-xs text-gray-500">{formatDateTime(new Date(r.createdAt))}</span>
                </div>
                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                  {r.lines.map((l) => (
                    <li key={l.id}>
                      {l.item?.sku ?? l.itemId} — {l.item?.description ?? ''}:{' '}
                      <strong>{l.qtyReceived}</strong> {l.item?.unit ?? ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackageSearch, Wrench, Package, AlertTriangle, Loader2, Plus } from 'lucide-react'

interface WorkOrderOption {
  id: string
  number: string
  summary: string
  status: string
}

interface ItemOption {
  id: string
  sku: string
  description: string
  unit: string
}

interface LineDraft {
  itemId: string
  qtyRequested: number
}

export default function NewRequisitionPage() {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([])
  const [items, setItems] = useState<ItemOption[]>([])
  const [workOrderId, setWorkOrderId] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([{ itemId: '', qtyRequested: 1 }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [woRes, iRes] = await Promise.all([
        fetch('/api/workorders'),
        fetch('/api/inventory/items'),
      ])
      if (woRes.ok) {
        const all: WorkOrderOption[] = await woRes.json()
        setWorkOrders(all.filter((w) => w.status !== 'RESOLVIDA' && w.status !== 'CANCELADA'))
      }
      if (iRes.ok) setItems(await iRes.json())
      setLoading(false)
    }
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const valid = lines.filter((l) => l.itemId && l.qtyRequested > 0)
      if (!workOrderId || valid.length === 0) {
        setError('Seleccione uma OT e pelo menos um artigo.')
        return
      }

      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId, lines: valid }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao criar requisição.')
        return
      }

      const created = await res.json()
      router.push(`/oficina/requisitions/${created.id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <PackageSearch size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <PackageSearch size={28} /> Nova Requisição
      </h1>
      <p className="text-gray-500 mb-8">Requisitar material para uma ordem de trabalho</p>

      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <Wrench size={14} /> Ordem de Trabalho *
          </label>
          <select
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            required
          >
            <option value="">Seleccione...</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>{wo.number} — {wo.summary}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
            <Package size={14} /> Artigos
          </label>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={line.itemId}
                  onChange={(e) => {
                    const next = [...lines]
                    next[i] = { ...next[i], itemId: e.target.value }
                    setLines(next)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="">Artigo...</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} — {it.description}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={line.qtyRequested}
                  onChange={(e) => {
                    const next = [...lines]
                    next[i] = { ...next[i], qtyRequested: parseInt(e.target.value) || 0 }
                    setLines(next)
                  }}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLines([...lines, { itemId: '', qtyRequested: 1 }])}
            className="text-sm text-blue-600 hover:underline font-medium mt-2"
          >
            + Adicionar linha
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> A criar...
            </>
          ) : (
            <>
              <Plus size={16} /> Criar Requisição
            </>
          )}
        </button>
      </form>
    </div>
  )
}

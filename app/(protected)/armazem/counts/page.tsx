'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'
import { MapPin, ClipboardList, X, Plus, AlertTriangle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'

interface LocationRow {
  id: string
  code: string
  warehouse: string
  aisle: string | null
  shelf: string | null
  position: string | null
}

interface ItemOption {
  id: string
  sku: string
  description: string
  unit: string
}

interface CountLine {
  id: string
  itemId: string
  expectedQty: number
  countedQty: number
}

interface InventoryCountRow {
  id: string
  status: string
  countedAt: string | null
  createdAt: string
  lines: CountLine[]
}

interface LineDraft {
  itemId: string
  expectedQty: number
  countedQty: number
}

export default function CountsPage() {
  const [tab, setTab] = useState<'counts' | 'locations'>('counts')

  const [counts, setCounts] = useState<InventoryCountRow[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [items, setItems] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(true)

  const [showCountForm, setShowCountForm] = useState(false)
  const [countLines, setCountLines] = useState<LineDraft[]>([{ itemId: '', expectedQty: 0, countedQty: 0 }])
  const [savingCount, setSavingCount] = useState(false)

  const [showLocationForm, setShowLocationForm] = useState(false)
  const [locationForm, setLocationForm] = useState({ code: '', warehouse: '', aisle: '', shelf: '', position: '' })
  const [savingLocation, setSavingLocation] = useState(false)

  const [error, setError] = useState('')

  const load = async () => {
    const [cRes, lRes, iRes] = await Promise.all([
      fetch('/api/inventory-counts'),
      fetch('/api/locations'),
      fetch('/api/inventory/items'),
    ])
    if (cRes.ok) setCounts(await cRes.json())
    if (lRes.ok) setLocations(await lRes.json())
    if (iRes.ok) setItems(await iRes.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const submitCount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCount(true)
    setError('')
    try {
      const valid = countLines.filter((l) => l.itemId)
      if (valid.length === 0) {
        setError('Adicione pelo menos um artigo.')
        return
      }
      const res = await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: valid }),
      })
      if (!res.ok) {
        setError('Erro ao registar contagem.')
        return
      }
      setCountLines([{ itemId: '', expectedQty: 0, countedQty: 0 }])
      setShowCountForm(false)
      await load()
    } finally {
      setSavingCount(false)
    }
  }

  const submitLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLocation(true)
    setError('')
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationForm),
      })
      if (!res.ok) {
        setError('Erro ao criar localização.')
        return
      }
      setLocationForm({ code: '', warehouse: '', aisle: '', shelf: '', position: '' })
      setShowLocationForm(false)
      await load()
    } finally {
      setSavingLocation(false)
    }
  }

  const completeCount = async (id: string) => {
    const res = await fetch(`/api/inventory-counts/${id}`, { method: 'PATCH' })
    if (res.ok) await load()
  }

  const itemLabel = (itemId: string) => {
    const it = items.find((i) => i.id === itemId)
    return it ? `${it.sku} — ${it.description}` : itemId
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <MapPin size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <MapPin size={28} /> Inventário e Localizações
      </h1>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('counts')}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-1.5 ${tab === 'counts' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-gray-500'}`}
        >
          <ClipboardList size={15} /> Contagens
        </button>
        <button
          onClick={() => setTab('locations')}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-1.5 ${tab === 'locations' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-gray-500'}`}
        >
          <MapPin size={15} /> Localizações
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-xl text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {tab === 'counts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contagens de Inventário ({counts.length})</h2>
            <button
              onClick={() => setShowCountForm(!showCountForm)}
              className="px-4 py-2.5 bg-amber-700 text-white rounded-xl hover:bg-amber-800 text-sm font-medium shadow-sm shadow-amber-700/20 transition-colors flex items-center gap-2"
            >
              {showCountForm ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Nova Contagem</>}
            </button>
          </div>

          {showCountForm && (
            <form onSubmit={submitCount} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6 space-y-4">
              <p className="text-sm text-gray-600">
                Introduza a quantidade esperada (sistema) e a quantidade contada (física). Divergências geram um
                ajuste de stock automático ao concluir a contagem.
              </p>

              {countLines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={line.itemId}
                    onChange={(e) => {
                      const next = [...countLines]
                      next[i] = { ...next[i], itemId: e.target.value }
                      setCountLines(next)
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
                    min={0}
                    placeholder="Esperado"
                    value={line.expectedQty}
                    onChange={(e) => {
                      const next = [...countLines]
                      next[i] = { ...next[i], expectedQty: parseInt(e.target.value) || 0 }
                      setCountLines(next)
                    }}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Contado"
                    value={line.countedQty}
                    onChange={(e) => {
                      const next = [...countLines]
                      next[i] = { ...next[i], countedQty: parseInt(e.target.value) || 0 }
                      setCountLines(next)
                    }}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => setCountLines([...countLines, { itemId: '', expectedQty: 0, countedQty: 0 }])}
                className="text-sm text-blue-600 hover:underline"
              >
                + Adicionar linha
              </button>

              <button
                type="submit"
                disabled={savingCount}
                className="w-full px-4 py-2.5 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {savingCount ? <><Loader2 size={16} className="animate-spin" /> A registar...</> : <><Plus size={16} /> Registar Contagem</>}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {counts.map((c) => (
              <div key={c.id} className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 w-fit ${
                      c.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {c.status === 'CONCLUIDA' && <CheckCircle2 size={12} />} {c.status === 'CONCLUIDA' ? 'Concluída' : 'Rascunho'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(new Date(c.createdAt))}</span>
                </div>
                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                  {c.lines.map((l) => {
                    const diff = l.countedQty - l.expectedQty
                    return (
                      <li key={l.id} className="flex justify-between">
                        <span>{itemLabel(l.itemId)}</span>
                        <span>
                          esperado <strong>{l.expectedQty}</strong> · contado <strong>{l.countedQty}</strong>
                          {diff !== 0 && (
                            <span className={diff > 0 ? 'text-emerald-600 ml-2' : 'text-red-600 ml-2'}>
                              ({diff > 0 ? '+' : ''}{diff})
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {c.status !== 'CONCLUIDA' && (
                  <button
                    onClick={() => completeCount(c.id)}
                    className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Concluir e Ajustar Stock <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}
            {counts.length === 0 && <p className="text-sm text-gray-500">Sem contagens registadas.</p>}
          </div>
        </div>
      )}

      {tab === 'locations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Localizações ({locations.length})</h2>
            <button
              onClick={() => setShowLocationForm(!showLocationForm)}
              className="px-4 py-2.5 bg-amber-700 text-white rounded-xl hover:bg-amber-800 text-sm font-medium shadow-sm shadow-amber-700/20 transition-colors flex items-center gap-2"
            >
              {showLocationForm ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Nova Localização</>}
            </button>
          </div>

          {showLocationForm && (
            <form onSubmit={submitLocation} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6 space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código (ex. A1-C02-P03-05)</label>
                <input
                  type="text"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Armazém</label>
                <input
                  type="text"
                  value={locationForm.warehouse}
                  onChange={(e) => setLocationForm({ ...locationForm, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corredor</label>
                  <input
                    type="text"
                    value={locationForm.aisle}
                    onChange={(e) => setLocationForm({ ...locationForm, aisle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prateleira</label>
                  <input
                    type="text"
                    value={locationForm.shelf}
                    onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
                  <input
                    type="text"
                    value={locationForm.position}
                    onChange={(e) => setLocationForm({ ...locationForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingLocation}
                className="w-full px-4 py-2.5 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {savingLocation ? <><Loader2 size={16} className="animate-spin" /> A criar...</> : <><Plus size={16} /> Criar Localização</>}
              </button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Código</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Armazém</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Corredor</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Prateleira</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Posição</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{l.code}</td>
                    <td className="px-6 py-4 text-gray-600">{l.warehouse}</td>
                    <td className="px-6 py-4 text-gray-600">{l.aisle || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{l.shelf || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{l.position || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

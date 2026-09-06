'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Tag, FileText, Building2, Ruler, TrendingDown, TrendingUp, Wallet, Barcode, AlertTriangle, Loader2, Plus } from 'lucide-react'

interface FormData {
  sku: string
  description: string
  brand: string
  unit: string
  minStock: string
  maxStock: string
  avgCost: string
  barcode: string
}

const emptyForm: FormData = {
  sku: '',
  description: '',
  brand: '',
  unit: 'UN',
  minStock: '0',
  maxStock: '10',
  avgCost: '0',
  barcode: '',
}

export default function NewItemPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: form.sku,
          description: form.description,
          brand: form.brand || undefined,
          unit: form.unit,
          minStock: parseInt(form.minStock) || 0,
          maxStock: parseInt(form.maxStock) || 1,
          avgCost: parseFloat(form.avgCost) || 0,
          barcode: form.barcode || undefined,
          active: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao criar artigo.')
        return
      }

      router.push('/armazem/inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Package size={28} /> Novo Artigo
      </h1>
      <p className="text-gray-500 mb-8">Registar um novo artigo no armazém</p>

      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <Tag size={14} /> SKU *
          </label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <FileText size={14} /> Descrição *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={2}
            required
            minLength={5}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Building2 size={14} /> Marca
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Ruler size={14} /> Unidade
            </label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="UN, L, Kg..."
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <TrendingDown size={14} /> Stock Mín.
            </label>
            <input
              type="number"
              min={0}
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <TrendingUp size={14} /> Stock Máx.
            </label>
            <input
              type="number"
              min={1}
              value={form.maxStock}
              onChange={(e) => setForm({ ...form, maxStock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Wallet size={14} /> Custo (Kz)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.avgCost}
              onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <Barcode size={14} /> Código de Barras
          </label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-sm shadow-amber-700/20 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> A criar...
            </>
          ) : (
            <>
              <Plus size={16} /> Criar Artigo
            </>
          )}
        </button>
      </form>
    </div>
  )
}

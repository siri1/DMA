'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'

interface Supplier {
  id: string
  name: string
  nif: string | null
  leadTimeDays: number
}

interface ItemOption {
  id: string
  sku: string
  description: string
  unit: string
}

interface POLine {
  id: string
  itemId: string
  qtyOrdered: number
  qtyReceived: number
  unitPrice: string
  item: ItemOption
}

interface PurchaseOrder {
  id: string
  status: string
  createdAt: string
  supplier: Supplier
  lines: POLine[]
}

interface LineDraft {
  itemId: string
  qtyOrdered: number
  unitPrice: number
}

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  PARCIAL: 'Parcial',
  RECEBIDA: 'Recebida',
  CANCELADA: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  PARCIAL: 'bg-yellow-100 text-yellow-800',
  RECEBIDA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
}

export default function PurchasesPage() {
  const [tab, setTab] = useState<'orders' | 'suppliers'>('orders')

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<ItemOption[]>([])
  const [loading, setLoading] = useState(true)

  // New PO form
  const [showPOForm, setShowPOForm] = useState(false)
  const [poSupplierId, setPOSupplierId] = useState('')
  const [poLines, setPOLines] = useState<LineDraft[]>([{ itemId: '', qtyOrdered: 1, unitPrice: 0 }])
  const [savingPO, setSavingPO] = useState(false)

  // New supplier form
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ name: '', nif: '', contact: '', phone: '', email: '', leadTimeDays: 7 })
  const [savingSupplier, setSavingSupplier] = useState(false)

  const [error, setError] = useState('')

  const load = async () => {
    const [oRes, sRes, iRes] = await Promise.all([
      fetch('/api/purchase-orders'),
      fetch('/api/suppliers'),
      fetch('/api/inventory/items'),
    ])
    if (oRes.ok) setOrders(await oRes.json())
    if (sRes.ok) setSuppliers(await sRes.json())
    if (iRes.ok) setItems(await iRes.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const submitPO = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPO(true)
    setError('')
    try {
      const valid = poLines.filter((l) => l.itemId && l.qtyOrdered > 0 && l.unitPrice > 0)
      if (!poSupplierId || valid.length === 0) {
        setError('Seleccione um fornecedor e pelo menos um artigo com preço.')
        return
      }
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: poSupplierId, lines: valid }),
      })
      if (!res.ok) {
        setError('Erro ao criar encomenda.')
        return
      }
      setPOSupplierId('')
      setPOLines([{ itemId: '', qtyOrdered: 1, unitPrice: 0 }])
      setShowPOForm(false)
      await load()
    } finally {
      setSavingPO(false)
    }
  }

  const submitSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSupplier(true)
    setError('')
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      })
      if (!res.ok) {
        setError('Erro ao criar fornecedor.')
        return
      }
      setSupplierForm({ name: '', nif: '', contact: '', phone: '', email: '', leadTimeDays: 7 })
      setShowSupplierForm(false)
      await load()
    } finally {
      setSavingSupplier(false)
    }
  }

  const advanceStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) await load()
  }

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Compras e Fornecedores</h1>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 font-medium text-sm ${tab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Encomendas
        </button>
        <button
          onClick={() => setTab('suppliers')}
          className={`px-4 py-2 font-medium text-sm ${tab === 'suppliers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Fornecedores
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-800 rounded text-sm mb-4">{error}</div>}

      {tab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Encomendas ({orders.length})</h2>
            <button
              onClick={() => setShowPOForm(!showPOForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {showPOForm ? 'Cancelar' : '+ Nova Encomenda'}
            </button>
          </div>

          {showPOForm && (
            <form onSubmit={submitPO} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPOSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Seleccione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {poLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={line.itemId}
                    onChange={(e) => {
                      const next = [...poLines]
                      next[i] = { ...next[i], itemId: e.target.value }
                      setPOLines(next)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Artigo...</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.sku} — {it.description}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Qtd"
                    value={line.qtyOrdered}
                    onChange={(e) => {
                      const next = [...poLines]
                      next[i] = { ...next[i], qtyOrdered: parseInt(e.target.value) || 0 }
                      setPOLines(next)
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Preço Kz"
                    value={line.unitPrice}
                    onChange={(e) => {
                      const next = [...poLines]
                      next[i] = { ...next[i], unitPrice: parseFloat(e.target.value) || 0 }
                      setPOLines(next)
                    }}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => setPOLines([...poLines, { itemId: '', qtyOrdered: 1, unitPrice: 0 }])}
                className="text-sm text-blue-600 hover:underline"
              >
                + Adicionar linha
              </button>

              <button
                type="submit"
                disabled={savingPO}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPO ? 'A criar...' : 'Criar Encomenda'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{o.supplier.name}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(new Date(o.createdAt))}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                  {o.lines.map((l) => (
                    <li key={l.id}>
                      {l.item.sku} — {l.item.description}: <strong>{l.qtyOrdered}</strong> {l.item.unit} × {Number(l.unitPrice).toLocaleString('pt-PT')} Kz
                    </li>
                  ))}
                </ul>
                {o.status === 'RASCUNHO' && (
                  <button
                    onClick={() => advanceStatus(o.id, 'ENVIADA')}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Marcar como Enviada →
                  </button>
                )}
                {o.status === 'ENVIADA' && (
                  <button
                    onClick={() => advanceStatus(o.id, 'RECEBIDA')}
                    className="mt-3 text-sm text-green-600 hover:underline"
                  >
                    Marcar como Recebida →
                  </button>
                )}
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-gray-500">Sem encomendas registadas.</p>}
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fornecedores ({suppliers.length})</h2>
            <button
              onClick={() => setShowSupplierForm(!showSupplierForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {showSupplierForm ? 'Cancelar' : '+ Novo Fornecedor'}
            </button>
          </div>

          {showSupplierForm && (
            <form onSubmit={submitSupplier} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                <input
                  type="text"
                  value={supplierForm.nif}
                  onChange={(e) => setSupplierForm({ ...supplierForm, nif: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                <input
                  type="text"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega (dias)</label>
                <input
                  type="number"
                  min={1}
                  value={supplierForm.leadTimeDays}
                  onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingSupplier}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSupplier ? 'A criar...' : 'Criar Fornecedor'}
              </button>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">NIF</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Prazo de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.nif}</td>
                    <td className="px-6 py-4 text-gray-600">{s.leadTimeDays} dias</td>
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

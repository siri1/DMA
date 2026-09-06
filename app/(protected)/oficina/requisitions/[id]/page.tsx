'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDateTime } from '@/lib/formatters'
import { REQUISITION_STATUS, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { PackageSearch, Package, Info, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'

interface RequisitionLine {
  id: string
  itemId: string
  qtyRequested: number
  qtyDelivered: number
  item: { sku: string; description: string; unit: string }
}

interface RequisitionDetail {
  id: string
  status: string
  createdAt: string
  workOrder: { number: string; summary: string; status: string }
  lines: RequisitionLine[]
}

export default function RequisitionDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const id = params.id as string

  const [req, setReq] = useState<RequisitionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await fetch(`/api/requisitions/${id}`)
      if (res.ok) setReq(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const deliver = async () => {
    setDelivering(true)
    setError('')
    try {
      const res = await fetch(`/api/requisitions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deliver' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao entregar requisição.')
        return
      }
      await load()
    } finally {
      setDelivering(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role as string | undefined
  const canDeliver = role && ['ARMAZEM', 'GESTAO', 'ADMIN'].includes(role)

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
  if (!req) return <div className="p-8">Requisição não encontrada</div>

  const meta = REQUISITION_STATUS[req.status] || { ...FALLBACK_META, label: req.status }
  const pendingDelivery = !['ENTREGUE', 'CANCELADA', 'DEVOLVIDA'].includes(req.status)

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PackageSearch size={28} /> Requisição — {req.workOrder.number}
          </h1>
          <p className="text-gray-500 mt-1">{req.workOrder.summary}</p>
        </div>
        <StatusBadge meta={meta} className="text-sm px-3 py-1.5" />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-6">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package size={18} /> Artigos <span className="text-xs font-normal text-gray-400">({req.lines.length})</span>
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Artigo</th>
                  <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Requisitado</th>
                  <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Entregue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {req.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-6 py-3 text-gray-800">{l.item.sku} — {l.item.description}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{l.qtyRequested} {l.item.unit}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">{l.qtyDelivered} {l.item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info size={18} /> Informação
          </h2>
          <dl className="space-y-3 text-sm mb-6">
            <div>
              <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Criada em</dt>
              <dd className="text-gray-800 mt-0.5">{formatDateTime(new Date(req.createdAt))}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Estado da OT</dt>
              <dd className="text-gray-800 mt-0.5">{req.workOrder.status}</dd>
            </div>
          </dl>

          {canDeliver && pendingDelivery && (
            <button
              onClick={deliver}
              disabled={delivering}
              className="w-full py-2.5 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {delivering ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> A entregar...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Marcar como Entregue
                </>
              )}
            </button>
          )}
          {!pendingDelivery && (
            <p className="text-sm text-gray-400 text-center">Requisição já finalizada</p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'
import { AUDIT_ACTION, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { Search, Download, SlidersHorizontal, Sparkles } from 'lucide-react'

interface AuditLog {
  id: string
  createdAt: string
  user: { name: string; email: string }
  action: string
  module: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [limit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      from: filters.from,
      to: filters.to,
    })
    if (filters.module) params.append('module', filters.module)
    if (filters.action) params.append('action', filters.action)

    const res = await fetch(`/api/audit?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, filters])

  const exportCSV = async () => {
    const params = new URLSearchParams({
      format: 'csv',
      from: filters.from,
      to: filters.to,
    })
    if (filters.module) params.append('module', filters.module)
    if (filters.action) params.append('action', filters.action)

    const res = await fetch(`/api/audit?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <Search size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Search size={28} /> Auditoria
          </h1>
          <p className="text-gray-500 text-sm mt-1">Registo imutável de todas as acções no sistema</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm shadow-sm shadow-emerald-600/20 transition-colors flex items-center gap-2"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SlidersHorizontal size={16} /> Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Módulo</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Todos</option>
              <option value="assets">Assets</option>
              <option value="workorders">WorkOrders</option>
              <option value="interventions">Intervenções</option>
              <option value="items">Artigos</option>
              <option value="stocks">Stocks</option>
              <option value="requisitions">Requisições</option>
              <option value="suppliers">Fornecedores</option>
              <option value="purchaseOrders">Encomendas</option>
              <option value="users">Utilizadores</option>
              <option value="audit">Auditoria</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Acção</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Todas</option>
              <option value="CREATE">Criar</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Apagar</option>
              <option value="STATE_CHANGE">Mudança Estado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilizador</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acção</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Módulo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Entidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => {
              const meta = AUDIT_ACTION[log.action] || { ...FALLBACK_META, label: log.action }
              return (
                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-3 text-xs text-gray-500">{formatDateTime(new Date(log.createdAt))}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{log.user.name}</td>
                  <td className="px-6 py-3 text-sm">
                    <StatusBadge meta={meta} />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{log.module}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 font-mono text-xs">
                    {log.entityType}:{log.entityId.slice(0, 8)}…
                  </td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} /> Sem registos para os filtros seleccionados
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <p>A mostrar {logs.length} de {total} registos</p>
        <div className="space-x-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'

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

  if (loading && logs.length === 0) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Auditoria</h1>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todos</option>
              <option value="assets">Assets</option>
              <option value="workorders">WorkOrders</option>
              <option value="interventions">Intervenções</option>
              <option value="items">Artigos</option>
              <option value="stocks">Stocks</option>
              <option value="requisitions">Requisições</option>
              <option value="users">Utilizadores</option>
              <option value="audit">Auditoria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acção</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todas</option>
              <option value="CREATE">Criar</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Apagar</option>
              <option value="STATE_CHANGE">Mudança Estado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Timestamp</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Utilizador</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Acção</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Módulo</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Entidade</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-xs text-gray-600">{formatDateTime(new Date(log.createdAt))}</td>
                <td className="px-6 py-4 text-sm">{log.user.name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{log.action}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{log.module}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.entityType}:{log.entityId.slice(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <p>
          A mostrar {logs.length} de {total} registos
        </p>
        <div className="space-x-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/formatters'
import { REQUISITION_STATUS, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { PackageSearch, Wrench, FolderOpen, AlertTriangle } from 'lucide-react'

interface RequisitionRow {
  id: string
  status: string
  createdAt: string
  workOrder: { number: string; summary: string }
  lines: { id: string }[]
}

const ACTIONABLE = ['PENDENTE', 'AGUARDA_MATERIAL', 'RESERVADA']

export default function ArmazemRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<RequisitionRow[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const res = await fetch('/api/requisitions')
        if (res.ok) {
          setRequisitions(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRequisitions()
  }, [])

  const pendingCount = requisitions.filter((r) => ACTIONABLE.includes(r.status)).length
  const statuses = Object.keys(REQUISITION_STATUS)
  const filtered = statusFilter ? requisitions.filter((r) => r.status === statusFilter) : requisitions

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <PackageSearch size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar requisições...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <PackageSearch size={28} /> Requisições de Manutenção
        </h1>
      </div>

      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 ring-1 ring-amber-100 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">
            <strong>{pendingCount}</strong> requisiç{pendingCount === 1 ? 'ão' : 'ões'} da Oficina a aguardar acção
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            !statusFilter ? 'bg-amber-700 text-white shadow-sm shadow-amber-700/20' : 'bg-white ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todas ({requisitions.length})
        </button>
        {statuses.map((status) => {
          const meta = REQUISITION_STATUS[status]
          const Icon = meta.icon
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === status ? 'bg-amber-700 text-white shadow-sm shadow-amber-700/20' : meta.badge
              }`}
            >
              <Icon size={14} /> {status} ({requisitions.filter((r) => r.status === status).length})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Nenhuma requisição encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((req) => {
            const meta = REQUISITION_STATUS[req.status] || { ...FALLBACK_META, label: req.status }
            return (
              <Link
                key={req.id}
                href={`/armazem/requisitions/${req.id}`}
                className="p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Wrench size={15} /> OT: {req.workOrder.number}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">{req.workOrder.summary}</p>
                    <div className="flex gap-2 mt-3 items-center">
                      <StatusBadge meta={meta} />
                      <span className="text-xs text-gray-400">
                        {req.lines.length} item(ns) — Criada {formatDate(new Date(req.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

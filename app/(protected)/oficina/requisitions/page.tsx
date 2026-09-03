'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/formatters'

interface RequisitionRow {
  id: string
  status: string
  createdAt: string
  workOrder: { number: string; summary: string }
  lines: { id: string }[]
}

const STATUS_META: Record<string, { emoji: string; accent: string }> = {
  PENDENTE: { emoji: '⏸️', accent: 'bg-gray-100 text-gray-800' },
  RESERVADA: { emoji: '🔒', accent: 'bg-blue-100 text-blue-800' },
  AGUARDA_MATERIAL: { emoji: '📦', accent: 'bg-amber-100 text-amber-800' },
  ENTREGUE: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800' },
  DEVOLVIDA: { emoji: '↩️', accent: 'bg-red-100 text-red-800' },
  CANCELADA: { emoji: '✕', accent: 'bg-gray-200 text-gray-600' },
}

export default function RequisitionsPage() {
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

  const statuses = Object.keys(STATUS_META)
  const filtered = statusFilter ? requisitions.filter((r) => r.status === statusFilter) : requisitions

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">📋</div>
          <p className="text-sm">A carregar requisições...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span>📋</span> Requisições de Material
        </h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            !statusFilter ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-white ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todas ({requisitions.length})
        </button>
        {statuses.map((status) => {
          const meta = STATUS_META[status]
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === status ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : `${meta.accent}`
              }`}
            >
              <span>{meta.emoji}</span> {status} ({requisitions.filter((r) => r.status === status).length})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-gray-500 text-sm">Nenhuma requisição encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((req) => {
            const meta = STATUS_META[req.status] || { emoji: '❔', accent: 'bg-gray-100 text-gray-800' }
            return (
              <Link
                key={req.id}
                href={`/oficina/requisitions/${req.id}`}
                className="p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">🛠️ OT: {req.workOrder.number}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{req.workOrder.summary}</p>
                    <div className="flex gap-2 mt-3 items-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${meta.accent}`}>
                        {meta.emoji} {req.status}
                      </span>
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

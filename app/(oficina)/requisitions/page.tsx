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

  const statuses = [
    'PENDENTE',
    'RESERVADA',
    'AGUARDA_MATERIAL',
    'ENTREGUE',
    'DEVOLVIDA',
    'CANCELADA',
  ]
  const filtered = statusFilter ? requisitions.filter((r) => r.status === statusFilter) : requisitions

  const statusColors: Record<string, string> = {
    PENDENTE: 'bg-gray-100 text-gray-800',
    RESERVADA: 'bg-blue-100 text-blue-800',
    AGUARDA_MATERIAL: 'bg-yellow-100 text-yellow-800',
    ENTREGUE: 'bg-green-100 text-green-800',
    DEVOLVIDA: 'bg-red-100 text-red-800',
    CANCELADA: 'bg-gray-200 text-gray-600',
  }

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Requisições de Material</h1>
        <Link
          href="/oficina/requisitions/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Nova Requisição
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            !statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Todas ({requisitions.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : `${statusColors[status]} font-medium`
            }`}
          >
            {status} ({requisitions.filter((r) => r.status === status).length})
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((req) => (
          <Link
            key={req.id}
            href={`/oficina/requisitions/${req.id}`}
            className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">OT: {req.workOrder.number}</h3>
                <p className="text-sm text-gray-600">{req.workOrder.summary}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {req.lines.length} item(ns) — Criada {formatDate(new Date(req.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ExecutiveMetrics {
  assetsInMaintenance: number
  workOrdersOpened: number
  workOrdersClosed: number
  workOrdersOverdue: number
  overdueMaintenancePlans: number
  avgResolutionTime: number
  totalStockValue: number
  period: { from: string; to: string }
}

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard/metrics?type=executive&from=${fromDate}&to=${toDate}`)
    if (res.ok) {
      setMetrics(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">📊</div>
          <p className="text-sm">A carregar métricas...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-sm">Erro ao carregar dados</p>
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Equipamentos em Manutenção', value: metrics.assetsInMaintenance, emoji: '🚜', accent: 'text-blue-600 bg-blue-50 ring-blue-100' },
    { label: 'OT Abertas', value: metrics.workOrdersOpened, emoji: '🟡', accent: 'text-amber-600 bg-amber-50 ring-amber-100' },
    { label: 'OT Concluídas', value: metrics.workOrdersClosed, emoji: '✅', accent: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { label: 'OT Atrasadas', value: metrics.workOrdersOverdue, emoji: '🔴', accent: 'text-red-600 bg-red-50 ring-red-100' },
    { label: 'Manutenções Vencidas', value: metrics.overdueMaintenancePlans, emoji: '🗓️', accent: 'text-orange-600 bg-orange-50 ring-orange-100' },
    { label: 'Tempo Médio Resolução', value: `${metrics.avgResolutionTime} dias`, emoji: '⏱️', accent: 'text-purple-600 bg-purple-50 ring-purple-100' },
  ]

  const chartData = [
    { name: 'Abertas', value: metrics.workOrdersOpened, fill: '#f59e0b' },
    { name: 'Concluídas', value: metrics.workOrdersClosed, fill: '#10b981' },
    { name: 'Atrasadas', value: metrics.workOrdersOverdue, fill: '#ef4444' },
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>📊</span> Dashboard Executivo
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visão consolidada de manutenção, ordens de trabalho e stock</p>
        </div>

        <div className="flex gap-3 bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ring-1 ${kpi.accent}`}>
              {kpi.emoji}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🗂️ Ordens de Trabalho (período seleccionado)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 flex flex-col justify-center">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            💰 Valor de Stock
          </h2>
          <p className="text-4xl font-bold text-emerald-600 flex items-baseline gap-2">
            {metrics.totalStockValue.toLocaleString('pt-PT')} <span className="text-lg font-medium text-emerald-500">Kz</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">Valor total de existências no armazém, ao custo médio ponderado</p>
        </div>
      </div>
    </div>
  )
}

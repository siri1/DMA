'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ExecutiveMetrics {
  assetsInMaintenance: number
  workOrdersOpened: number
  workOrdersClosed: number
  workOrdersOverdue: number
  overdueMaintenancePlans: number
  avgResolutionTime: number
  totalStockValue: number
  assetCosts: Record<string, number>
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
  }, [fromDate, toDate])

  if (loading) return <div className="p-8">A carregar...</div>

  if (!metrics) return <div className="p-8 text-red-600">Erro ao carregar dados</div>

  const kpis = [
    { label: 'Equipamentos em Manutenção', value: metrics.assetsInMaintenance, color: 'bg-blue-500' },
    { label: 'OT Abertas', value: metrics.workOrdersOpened, color: 'bg-yellow-500' },
    { label: 'OT Concluídas', value: metrics.workOrdersClosed, color: 'bg-green-500' },
    { label: 'OT Atrasadas', value: metrics.workOrdersOverdue, color: 'bg-red-500' },
    { label: 'Manutenções Vencidas', value: metrics.overdueMaintenancePlans, color: 'bg-orange-500' },
    { label: 'Tempo Médio Resolução', value: `${metrics.avgResolutionTime} dias`, color: 'bg-purple-500' },
  ]

  const chartData = [
    { name: 'Abertas', value: metrics.workOrdersOpened },
    { name: 'Concluídas', value: metrics.workOrdersClosed },
    { name: 'Atrasadas', value: metrics.workOrdersOverdue },
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Painel Executivo</h1>

        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg shadow p-6">
            <div className={`${kpi.color} text-white rounded-lg p-4 mb-4`}>
              <p className="text-sm font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold mt-2">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordens de Trabalho (últimos 30 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Valor de Stock</h2>
          <p className="text-3xl font-bold text-green-600">{metrics.totalStockValue.toLocaleString('pt-PT')} Kz</p>
          <p className="text-sm text-gray-600 mt-2">Valor total de existências no armazém</p>
        </div>
      </div>
    </div>
  )
}

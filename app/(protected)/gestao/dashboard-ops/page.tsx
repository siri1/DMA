'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'

interface OperationalMetrics {
  assetsByState: Record<string, number>
  overdueWorkOrders: Array<{ id: string; number: string; summary: string; dueAt: string; asset: { assetCode: string } }>
  overdueMaintenancePlans: Array<{ id: string; nextDueAt: string; asset: { assetCode: string; description: string } }>
  lowStockItems: Array<{ id: string; sku: string; description: string; minStock: number; currentQty: number; deficit: number }>
}

export default function OperationalDashboard() {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/dashboard/metrics?type=operational')
      if (res.ok) {
        setMetrics(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8">A carregar...</div>
  if (!metrics) return <div className="p-8 text-red-600">Erro ao carregar dados</div>

  const stateColors: Record<string, string> = {
    EM_OPERACAO: 'bg-green-100 text-green-800',
    EM_MANUTENCAO: 'bg-yellow-100 text-yellow-800',
    INDISPONIVEL: 'bg-red-100 text-red-800',
    FORA_DE_SERVICO: 'bg-gray-100 text-gray-800',
    QUARENTENA: 'bg-orange-100 text-orange-800',
    ABATIDO: 'bg-black text-white',
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Painel Operacional</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(metrics.assetsByState).map(([state, count]) => (
          <div key={state} className={`${stateColors[state] || 'bg-gray-100'} rounded-lg p-6`}>
            <p className="text-sm font-medium">{state}</p>
            <p className="text-2xl font-bold mt-2">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordens Atrasadas ({metrics.overdueWorkOrders.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.overdueWorkOrders.length === 0 ? (
              <p className="text-sm text-gray-500">Sem ordens atrasadas</p>
            ) : (
              metrics.overdueWorkOrders.map((wo) => (
                <div key={wo.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-red-900">{wo.number}</p>
                      <p className="text-sm text-gray-600">{wo.asset.assetCode} — {wo.summary}</p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDateTime(new Date(wo.dueAt))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manutenções Vencidas ({metrics.overdueMaintenancePlans.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.overdueMaintenancePlans.length === 0 ? (
              <p className="text-sm text-gray-500">Sem manutenções vencidas</p>
            ) : (
              metrics.overdueMaintenancePlans.map((mp) => (
                <div key={mp.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-medium text-yellow-900">{mp.asset.assetCode}</p>
                  <p className="text-sm text-gray-600">{mp.asset.description}</p>
                  <p className="text-xs text-gray-500">Vencida em {formatDateTime(new Date(mp.nextDueAt))}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Artigos Abaixo do Mínimo ({metrics.lowStockItems.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Descrição</th>
                  <th className="text-right py-2">Stock Actual</th>
                  <th className="text-right py-2">Mínimo</th>
                  <th className="text-right py-2">Falta</th>
                </tr>
              </thead>
              <tbody>
                {metrics.lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium text-red-600">{item.sku}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="text-right py-2">{item.currentQty}</td>
                    <td className="text-right py-2">{item.minStock}</td>
                    <td className="text-right py-2 font-bold text-red-600">{item.deficit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

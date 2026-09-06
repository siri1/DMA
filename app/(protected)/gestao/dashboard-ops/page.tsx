'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/formatters'
import { ASSET_STATUS, FALLBACK_META } from '@/lib/status-icons'
import { TrendingUp, XCircle, Sparkles, CalendarClock, Package, AlertOctagon } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <TrendingUp size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar métricas...</p>
        </div>
      </div>
    )
  }
  if (!metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">
          <XCircle size={40} className="mx-auto mb-3" />
          <p className="text-sm">Erro ao carregar dados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <TrendingUp size={28} /> Dashboard Operacional
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(metrics.assetsByState).map(([state, count]) => {
          const meta = ASSET_STATUS[state] || { ...FALLBACK_META, label: state }
          const Icon = meta.icon
          return (
            <div key={state} className={`rounded-2xl p-4 ring-1 ring-gray-100 ${meta.badge} shadow-sm`}>
              <Icon size={22} className={`mb-1.5 ${meta.text}`} />
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs font-medium mt-0.5 text-gray-600">{meta.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-500" /> Ordens Atrasadas <span className="text-xs font-normal text-gray-400">({metrics.overdueWorkOrders.length})</span>
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.overdueWorkOrders.length === 0 ? (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Sparkles size={15} /> Sem ordens atrasadas
              </p>
            ) : (
              metrics.overdueWorkOrders.map((wo) => (
                <div key={wo.id} className="p-3 bg-red-50 rounded-xl ring-1 ring-red-100">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-red-900 text-sm">{wo.number}</p>
                      <p className="text-sm text-gray-600 truncate">{wo.asset.assetCode} — {wo.summary}</p>
                    </div>
                    <p className="text-xs text-gray-500 shrink-0">{formatDateTime(new Date(wo.dueAt))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarClock size={18} className="text-amber-500" /> Manutenções Vencidas <span className="text-xs font-normal text-gray-400">({metrics.overdueMaintenancePlans.length})</span>
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.overdueMaintenancePlans.length === 0 ? (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Sparkles size={15} /> Sem manutenções vencidas
              </p>
            ) : (
              metrics.overdueMaintenancePlans.map((mp) => (
                <div key={mp.id} className="p-3 bg-amber-50 rounded-xl ring-1 ring-amber-100">
                  <p className="font-medium text-amber-900 text-sm">{mp.asset.assetCode}</p>
                  <p className="text-sm text-gray-600">{mp.asset.description}</p>
                  <p className="text-xs text-gray-500">Vencida em {formatDateTime(new Date(mp.nextDueAt))}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> Artigos Abaixo do Mínimo <span className="text-xs font-normal text-gray-400">({metrics.lowStockItems.length})</span>
          </h2>
          {metrics.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Sparkles size={15} /> Todos os artigos acima do mínimo
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="text-left py-2 font-medium">SKU</th>
                    <th className="text-left py-2 font-medium">Descrição</th>
                    <th className="text-right py-2 font-medium">Stock Actual</th>
                    <th className="text-right py-2 font-medium">Mínimo</th>
                    <th className="text-right py-2 font-medium">Falta</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.lowStockItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 font-medium text-red-600">{item.sku}</td>
                      <td className="py-2.5">{item.description}</td>
                      <td className="text-right py-2.5">{item.currentQty}</td>
                      <td className="text-right py-2.5">{item.minStock}</td>
                      <td className="text-right py-2.5 font-bold text-red-600">{item.deficit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

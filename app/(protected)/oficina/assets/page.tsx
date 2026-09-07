'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AssetCard } from '@/components/domain/AssetCard'
import type { Asset, AssetStatus } from '@prisma/client'
import { ASSET_STATUS, FALLBACK_META } from '@/lib/status-icons'
import { Truck, Plus, LayoutGrid, FolderOpen } from 'lucide-react'

const ALL_META = { icon: LayoutGrid, text: 'text-gray-600', badge: '', label: 'Todos' }

export default function AssetListPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'ALL'>('ALL')

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
        const res = await fetch(`/api/assets${params}`)
        if (res.ok) {
          setAssets(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [statusFilter])

  const statuses: Array<AssetStatus | 'ALL'> = [
    'ALL',
    'EM_OPERACAO',
    'EM_MANUTENCAO',
    'INDISPONIVEL',
    'FORA_DE_SERVICO',
    'QUARENTENA',
    'ABATIDO',
  ]

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck size={28} /> Equipamentos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de activos da manutenção</p>
        </div>
        <Link
          href="/oficina/assets/new"
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Novo Equipamento
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {statuses.map((status) => {
            const meta = status === 'ALL' ? ALL_META : ASSET_STATUS[status] || { ...FALLBACK_META, label: status }
            const Icon = meta.icon
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} /> {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Truck size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar equipamentos...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Nenhum equipamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/oficina/assets/${asset.id}`}>
              <AssetCard asset={asset} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

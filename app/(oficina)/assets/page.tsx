'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AssetCard } from '@/components/domain/AssetCard'
import type { Asset, AssetStatus } from '@prisma/client'

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

  const statuses = [
    'ALL',
    'EM_OPERACAO',
    'EM_MANUTENCAO',
    'INDISPONIVEL',
    'FORA_DE_SERVICO',
    'QUARENTENA',
    'ABATIDO',
  ] as const

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-gray-600 mt-2">Gestão de activos da manutenção</p>
        </div>
        <Link
          href="/oficina/assets/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Novo Equipamento
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">A carregar equipamentos...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Nenhum equipamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

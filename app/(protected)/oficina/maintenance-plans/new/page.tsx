'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MaintenancePlanForm } from '@/components/domain/MaintenancePlanForm'
import { CalendarClock, ArrowLeft, Truck } from 'lucide-react'

interface AssetOption {
  id: string
  assetCode: string
  description: string
}

export default function NewMaintenancePlanPage() {
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [selectedAsset, setSelectedAsset] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch('/api/assets')
        if (res.ok) {
          setAssets(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <CalendarClock size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/oficina/maintenance-plans" className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <CalendarClock size={28} /> Novo Plano de Manutenção
      </h1>
      <p className="text-gray-500 mb-8">Definir manutenção periódica para um equipamento</p>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
        {!selectedAsset ? (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-4">
              <Truck size={15} /> Seleccionar Equipamento
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className="p-4 text-left border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{asset.assetCode}</p>
                  <p className="text-sm text-gray-600">{asset.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedAsset('')}
              className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Escolher outro equipamento
            </button>

            <div className="p-4 bg-blue-50 ring-1 ring-blue-100 rounded-xl mb-6">
              <p className="text-sm text-blue-800 flex items-center gap-1.5">
                <Truck size={14} /> {assets.find((a) => a.id === selectedAsset)?.assetCode} —{' '}
                {assets.find((a) => a.id === selectedAsset)?.description}
              </p>
            </div>

            <MaintenancePlanForm
              assetId={selectedAsset}
              onSuccess={() => {
                typeof window !== 'undefined' &&
                  (window.location.href = '/oficina/maintenance-plans')
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

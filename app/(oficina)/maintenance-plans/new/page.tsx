'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MaintenancePlanForm } from '@/components/domain/MaintenancePlanForm'

export default function NewMaintenancePlanPage() {
  const [assets, setAssets] = useState<any[]>([])
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

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/oficina/maintenance-plans" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Voltar
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Plano de Manutenção</h1>
      <p className="text-gray-600 mb-8">Definir manutenção periódica para um equipamento</p>

      <div className="bg-white rounded-lg shadow p-6">
        {!selectedAsset ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Seleccionar Equipamento
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
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
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              ← Escolher outro equipamento
            </button>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                {assets.find((a) => a.id === selectedAsset)?.assetCode} —{' '}
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

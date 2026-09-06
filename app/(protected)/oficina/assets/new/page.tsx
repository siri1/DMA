'use client'

import { AssetForm } from '@/components/domain/AssetForm'
import { Truck } from 'lucide-react'

export default function NewAssetPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Truck size={28} /> Novo Equipamento
      </h1>
      <p className="text-gray-500 mb-8">Registar um novo activo na manutenção</p>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
        <AssetForm
          onSuccess={() => {
            typeof window !== 'undefined' &&
              (window.location.href = '/oficina/assets')
          }}
        />
      </div>
    </div>
  )
}

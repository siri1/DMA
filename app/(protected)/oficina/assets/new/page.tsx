'use client'

import { AssetForm } from '@/components/domain/AssetForm'

export default function NewAssetPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Equipamento</h1>
      <p className="text-gray-600 mb-8">Registar um novo activo na manutenção</p>

      <div className="bg-white rounded-lg shadow p-6">
        <AssetForm
          onSuccess={() => {
            // Redirect após sucesso
            typeof window !== 'undefined' &&
              (window.location.href = '/oficina/assets')
          }}
        />
      </div>
    </div>
  )
}

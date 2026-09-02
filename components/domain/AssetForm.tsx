'use client'

import { useState } from 'react'
import { createAssetAction, updateAssetAction } from '@/modules/assets/actions'
import type { Asset } from '@prisma/client'

interface AssetFormProps {
  asset?: Asset
  onSuccess?: () => void
}

export function AssetForm({ asset, onSuccess }: AssetFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      if (asset) {
        await updateAssetAction(asset.id, data)
      } else {
        await createAssetAction(data)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar formulário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Código do Equipamento *
        </label>
        <input
          type="text"
          name="assetCode"
          defaultValue={asset?.assetCode}
          required
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descrição *
        </label>
        <textarea
          name="description"
          defaultValue={asset?.description}
          required
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Marca
          </label>
          <input
            type="text"
            name="brand"
            defaultValue={asset?.brand || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Modelo
          </label>
          <input
            type="text"
            name="model"
            defaultValue={asset?.model || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Número de Série
          </label>
          <input
            type="text"
            name="serialNumber"
            defaultValue={asset?.serialNumber || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Entrada *
          </label>
          <input
            type="date"
            name="entryDate"
            defaultValue={asset?.entryDate?.toISOString().split('T')[0]}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Localização
        </label>
        <input
          type="text"
          name="location"
          defaultValue={asset?.location || ''}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Família
        </label>
        <input
          type="text"
          name="family"
          defaultValue={asset?.family || ''}
          placeholder="Ex: Empilhadores, Geradores, Compressores"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Diagnóstico
        </label>
        <textarea
          name="diagnosis"
          defaultValue={asset?.diagnosis || ''}
          rows={2}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'A processar...' : asset ? 'Actualizar' : 'Criar Equipamento'}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { createAssetAction, updateAssetAction } from '@/modules/assets/actions'
import type { Asset } from '@prisma/client'
import { AlertTriangle, Tag, FileText, Building2, Cog, Hash, Calendar, MapPin, FolderTree, Stethoscope, Loader2, Check, Plus } from 'lucide-react'

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
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Tag size={14} /> Código do Equipamento *
        </label>
        <input
          type="text"
          name="assetCode"
          defaultValue={asset?.assetCode}
          required
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <FileText size={14} /> Descrição *
        </label>
        <textarea
          name="description"
          defaultValue={asset?.description}
          required
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Building2 size={14} /> Marca
          </label>
          <input
            type="text"
            name="brand"
            defaultValue={asset?.brand || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Cog size={14} /> Modelo
          </label>
          <input
            type="text"
            name="model"
            defaultValue={asset?.model || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Hash size={14} /> Número de Série
          </label>
          <input
            type="text"
            name="serialNumber"
            defaultValue={asset?.serialNumber || ''}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Calendar size={14} /> Data de Entrada *
          </label>
          <input
            type="date"
            name="entryDate"
            defaultValue={asset?.entryDate?.toISOString().split('T')[0]}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <MapPin size={14} /> Localização
        </label>
        <input
          type="text"
          name="location"
          defaultValue={asset?.location || ''}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <FolderTree size={14} /> Família
        </label>
        <input
          type="text"
          name="family"
          defaultValue={asset?.family || ''}
          placeholder="Ex: Empilhadores, Geradores, Compressores"
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Stethoscope size={14} /> Diagnóstico
        </label>
        <textarea
          name="diagnosis"
          defaultValue={asset?.diagnosis || ''}
          rows={2}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> A processar...
          </>
        ) : asset ? (
          <>
            <Check size={16} /> Actualizar
          </>
        ) : (
          <>
            <Plus size={16} /> Criar Equipamento
          </>
        )}
      </button>
    </form>
  )
}

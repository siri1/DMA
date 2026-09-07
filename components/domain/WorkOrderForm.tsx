'use client'

import { useEffect, useState } from 'react'
import { createWorkOrderAction } from '@/modules/workorders/actions'
import { WORKORDER_PRIORITY } from '@/lib/status-icons'
import {
  AlertTriangle,
  FileText,
  AlarmClock,
  Loader2,
  Plus,
  Search,
  X,
  Truck,
  MapPin,
  UserCheck,
  Zap,
  CalendarClock,
  Hand,
  type LucideIcon,
} from 'lucide-react'

interface AssetOption {
  id: string
  assetCode: string
  description: string
  location: string | null
}

interface TechnicianOption {
  id: string
  name: string
}

interface WorkOrderFormProps {
  /** Pre-selected asset (e.g. arriving from an asset's detail page). When
   * absent, the form shows a searchable asset picker instead. */
  assetId?: string
  onSuccess?: (workOrderId: string) => void
}

const ORIGIN_OPTIONS: Array<{ value: string; label: string; icon: LucideIcon; hint: string }> = [
  { value: 'AVARIA', label: 'Avaria', icon: Zap, hint: 'Falha reportada no equipamento' },
  { value: 'PLANO', label: 'Plano', icon: CalendarClock, hint: 'Gerada por um plano de manutenção' },
  { value: 'MANUAL', label: 'Manual', icon: Hand, hint: 'Criada directamente por um utilizador' },
]

const PRIORITY_ORDER = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']

export function WorkOrderForm({ assetId, onSuccess }: WorkOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [selectedAssetId, setSelectedAssetId] = useState(assetId || '')
  const [assetSearch, setAssetSearch] = useState('')
  const [showAssetPicker, setShowAssetPicker] = useState(!assetId)

  const [summary, setSummary] = useState('')
  const [origin, setOrigin] = useState('AVARIA')
  const [priority, setPriority] = useState('MEDIA')
  const [assignedToId, setAssignedToId] = useState('')
  const [dueAt, setDueAt] = useState('')

  useEffect(() => {
    const load = async () => {
      const [aRes, tRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/users/technicians'),
      ])
      if (aRes.ok) setAssets(await aRes.json())
      if (tRes.ok) setTechnicians(await tRes.json())
      setLoadingOptions(false)
    }
    load()
  }, [])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  const filteredAssets = assetSearch
    ? assets.filter(
        (a) =>
          a.assetCode.toLowerCase().includes(assetSearch.toLowerCase()) ||
          a.description.toLowerCase().includes(assetSearch.toLowerCase())
      )
    : assets

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!selectedAssetId) {
      setError('Seleccione o equipamento para esta ordem de trabalho.')
      return
    }
    if (summary.trim().length < 5) {
      setError('Descreva o problema com pelo menos 5 caracteres.')
      return
    }

    setLoading(true)
    try {
      const workOrder = await createWorkOrderAction({
        assetId: selectedAssetId,
        summary,
        origin,
        priority,
        assignedToId: assignedToId || undefined,
        dueAt: dueAt || undefined,
      })
      onSuccess?.(workOrder.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar OT')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Asset selection */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          <Truck size={14} /> Equipamento *
        </label>

        {selectedAsset && !showAssetPicker ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 ring-1 ring-blue-100 rounded-xl">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {selectedAsset.assetCode} — {selectedAsset.description}
              </p>
              {selectedAsset.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {selectedAsset.location}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAssetPicker(true)}
              className="text-xs text-blue-700 hover:underline shrink-0 ml-3"
            >
              Alterar
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Procurar por código ou descrição..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                autoFocus
              />
              {selectedAssetId && (
                <button type="button" onClick={() => setShowAssetPicker(false)}>
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loadingOptions ? (
                <p className="text-sm text-gray-400 p-3">A carregar equipamentos...</p>
              ) : filteredAssets.length === 0 ? (
                <p className="text-sm text-gray-400 p-3">Nenhum equipamento encontrado</p>
              ) : (
                filteredAssets.slice(0, 30).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAssetId(a.id)
                      setShowAssetPicker(false)
                      setAssetSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      selectedAssetId === a.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="font-medium text-gray-900">{a.assetCode}</span>
                    <span className="text-gray-500"> — {a.description}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          <FileText size={14} /> Resumo *
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          minLength={5}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Descrição breve do problema ou tarefa"
        />
      </div>

      {/* Origin - visual pills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Origem *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ORIGIN_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = origin === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOrigin(opt.value)}
                className={`p-3 rounded-xl text-left border-2 transition-colors ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
                title={opt.hint}
              >
                <Icon size={17} className={active ? 'text-blue-600' : 'text-gray-400'} />
                <p className={`text-sm font-medium mt-1.5 ${active ? 'text-blue-900' : 'text-gray-700'}`}>{opt.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority - visual pills using shared status-icons meta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRIORITY_ORDER.map((value) => {
            const meta = WORKORDER_PRIORITY[value]
            const Icon = meta.icon
            const active = priority === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`p-3 rounded-xl text-center border-2 transition-colors ${
                  active ? meta.badge + ' border-transparent' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <Icon size={16} className="mx-auto" />
                <p className="text-xs font-medium mt-1">{meta.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Assignment + due date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <UserCheck size={14} /> Atribuir a
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Não atribuído</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <AlarmClock size={14} /> Prazo
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> A criar...
          </>
        ) : (
          <>
            <Plus size={16} /> Criar Ordem de Trabalho
          </>
        )}
      </button>
    </form>
  )
}

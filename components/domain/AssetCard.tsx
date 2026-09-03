import type { Asset } from '@prisma/client'
import { formatDate } from '@/lib/formatters'

const STATUS_META: Record<string, { emoji: string; accent: string; label: string }> = {
  EM_OPERACAO: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800', label: 'Em Operação' },
  EM_MANUTENCAO: { emoji: '🔧', accent: 'bg-amber-100 text-amber-800', label: 'Em Manutenção' },
  INDISPONIVEL: { emoji: '🚫', accent: 'bg-red-100 text-red-800', label: 'Indisponível' },
  FORA_DE_SERVICO: { emoji: '⛔', accent: 'bg-gray-100 text-gray-800', label: 'Fora de Serviço' },
  QUARENTENA: { emoji: '⚠️', accent: 'bg-orange-100 text-orange-800', label: 'Quarentena' },
  ABATIDO: { emoji: '🗑️', accent: 'bg-slate-200 text-slate-800', label: 'Abatido' },
}

interface AssetCardProps {
  asset: Asset
  onClick?: () => void
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const meta = STATUS_META[asset.status] || { emoji: '❔', accent: 'bg-gray-100 text-gray-800', label: asset.status }

  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 font-mono">{asset.assetCode}</p>
          <p className="text-base font-semibold text-gray-900 truncate">{asset.description}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.accent}`}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {asset.brand && <p className="flex items-center gap-1.5">🏷️ {asset.brand} {asset.model && `· ${asset.model}`}</p>}
        {asset.location && <p className="flex items-center gap-1.5">📍 {asset.location}</p>}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">🗓️ Entrada: {formatDate(asset.entryDate)}</p>
      </div>
    </div>
  )
}

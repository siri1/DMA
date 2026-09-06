import type { Asset } from '@prisma/client'
import { formatDate } from '@/lib/formatters'
import { ASSET_STATUS, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { Tag, MapPin, Calendar } from 'lucide-react'

interface AssetCardProps {
  asset: Asset
  onClick?: () => void
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const meta = ASSET_STATUS[asset.status] || { ...FALLBACK_META, label: asset.status }

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
        <StatusBadge meta={meta} className="shrink-0" />
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {asset.brand && (
          <p className="flex items-center gap-1.5">
            <Tag size={13} className="text-gray-400" /> {asset.brand} {asset.model && `· ${asset.model}`}
          </p>
        )}
        {asset.location && (
          <p className="flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400" /> {asset.location}
          </p>
        )}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
          <Calendar size={12} /> Entrada: {formatDate(asset.entryDate)}
        </p>
      </div>
    </div>
  )
}

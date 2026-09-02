import type { Asset } from '@prisma/client'
import { formatDate } from '@/lib/formatters'

const statusColors: Record<string, string> = {
  EM_OPERACAO: 'bg-green-100 text-green-800',
  EM_MANUTENCAO: 'bg-yellow-100 text-yellow-800',
  INDISPONIVEL: 'bg-red-100 text-red-800',
  FORA_DE_SERVICO: 'bg-gray-100 text-gray-800',
  QUARENTENA: 'bg-orange-100 text-orange-800',
  ABATIDO: 'bg-slate-100 text-slate-800',
}

interface AssetCardProps {
  asset: Asset
  onClick?: () => void
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const statusColor = statusColors[asset.status] || 'bg-gray-100 text-gray-800'

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-600">{asset.assetCode}</p>
          <p className="text-lg font-semibold text-gray-900">
            {asset.description}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {asset.status}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {asset.brand && <p>Marca: {asset.brand}</p>}
        {asset.model && <p>Modelo: {asset.model}</p>}
        {asset.location && <p>Local: {asset.location}</p>}
        <p className="text-xs text-gray-500">
          Entrada: {formatDate(asset.entryDate)}
        </p>
      </div>
    </div>
  )
}

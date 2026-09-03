'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDateTime } from '@/lib/formatters'

interface WorkOrderRow {
  id: string
  number: string
  summary: string
  status: string
  priority: string
  dueAt: string | null
  asset?: { description: string; assetCode: string }
}

const STATUS_META: Record<string, { emoji: string; label: string; bg: string }> = {
  ABERTA: { emoji: '🆕', label: 'Abertas', bg: 'from-blue-700 to-blue-900' },
  EM_CURSO: { emoji: '⏳', label: 'Em Curso', bg: 'from-amber-600 to-amber-800' },
  EM_DIAGNOSTICO: { emoji: '🩺', label: 'Em Diagnóstico', bg: 'from-purple-700 to-purple-900' },
  EM_REPARACAO: { emoji: '🔧', label: 'Em Reparação', bg: 'from-orange-600 to-orange-800' },
  AGUARDA_MATERIAL: { emoji: '📦', label: 'Aguarda Material', bg: 'from-red-700 to-red-900' },
  EM_INSPECCAO: { emoji: '🔎', label: 'Em Inspecção', bg: 'from-indigo-700 to-indigo-900' },
}

const PRIORITY_EMOJI: Record<string, string> = {
  CRITICA: '🔴',
  ALTA: '🟠',
  MEDIA: '🟡',
  BAIXA: '🟢',
}

const ROTATE_MS = 10000
const REFRESH_MS = 15000

export default function PainelTV() {
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [showAvailable, setShowAvailable] = useState(false)
  const [availableCount, setAvailableCount] = useState<number | null>(null)
  const [now, setNow] = useState(new Date())

  const load = useCallback(async () => {
    const res = await fetch('/api/workorders')
    if (res.ok) {
      const all: WorkOrderRow[] = await res.json()
      setWorkOrders(all.filter((w) => w.status !== 'RESOLVIDA' && w.status !== 'CANCELADA'))
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = setInterval(load, REFRESH_MS)
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(refresh)
      clearInterval(clock)
    }
  }, [load])

  const groups = Object.keys(STATUS_META)
    .map((status) => ({
      status,
      meta: STATUS_META[status],
      items: workOrders.filter((w) => w.status === status),
    }))
    .filter((g) => g.items.length > 0)

  useEffect(() => {
    if (groups.length === 0) return
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % groups.length)
    }, ROTATE_MS)
    return () => clearInterval(interval)
  }, [groups.length])

  const checkAvailable = async () => {
    setShowAvailable(true)
    const res = await fetch('/api/assets?status=EM_OPERACAO')
    if (res.ok) {
      const assets = await res.json()
      setAvailableCount(Array.isArray(assets) ? assets.length : 0)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 flex flex-col items-center justify-center text-white">
        <div className="text-9xl mb-8">✅</div>
        <h2 className="text-5xl font-light">Sem Ordens de Trabalho Pendentes</h2>
        <p className="text-2xl mt-6 text-emerald-200">{now.toLocaleTimeString('pt-PT')}</p>
      </div>
    )
  }

  const page = groups[currentPage] || groups[0]

  return (
    <div className={`w-screen h-screen overflow-hidden bg-gradient-to-br ${page.meta.bg} relative`}>
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center text-white/70 text-lg">
        <span className="flex items-center gap-2">🛠️ DMA Vision — Oficina</span>
        <span>{now.toLocaleTimeString('pt-PT')}</span>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center px-16">
        <div className="text-8xl mb-4">{page.meta.emoji}</div>
        <h1 className="text-9xl font-bold text-white mb-2 tabular-nums">{page.items.length}</h1>
        <h2 className="text-5xl text-white/90 font-light mb-12">{page.meta.label}</h2>

        <div className="w-full max-w-4xl space-y-3 max-h-[40vh] overflow-hidden">
          {page.items.slice(0, 5).map((wo) => (
            <div key={wo.id} className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{PRIORITY_EMOJI[wo.priority] || '⚪'}</span>
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white/70">{wo.number}</p>
                  <p className="text-xl font-medium truncate">{wo.asset?.description || wo.summary}</p>
                </div>
              </div>
              {wo.dueAt && <span className="text-sm text-white/60 shrink-0 ml-4">{formatDateTime(new Date(wo.dueAt))}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-8 flex items-center gap-2 text-white/50 text-sm">
        {groups.map((g, i) => (
          <span
            key={g.status}
            className={`w-2 h-2 rounded-full transition-all ${i === currentPage ? 'bg-white w-6' : 'bg-white/40'}`}
          />
        ))}
      </div>

      <button
        onClick={checkAvailable}
        className="absolute bottom-6 right-8 text-white/40 hover:text-white/90 text-xs px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        Ver disponíveis
      </button>

      {showAvailable && (
        <div
          onClick={() => setShowAvailable(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center cursor-pointer"
        >
          <div className="text-center text-white">
            <div className="text-7xl mb-4">✅</div>
            <p className="text-8xl font-bold tabular-nums">{availableCount ?? '…'}</p>
            <p className="text-2xl text-white/80 mt-2">Equipamentos Disponíveis</p>
            <p className="text-sm text-white/40 mt-8">Toque para fechar</p>
          </div>
        </div>
      )}
    </div>
  )
}

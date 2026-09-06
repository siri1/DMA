'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { WorkOrder, WorkOrderStatus } from '@prisma/client'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/formatters'
import { WORKORDER_STATUS, WORKORDER_PRIORITY, INTERVENTION_RESULT, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import { transitionWorkOrderStateAction } from '@/modules/states/actions'
import {
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  Loader2,
  Check,
  Play,
  Square,
  Wrench,
  Timer,
  Wallet,
  ArrowRight,
  X,
} from 'lucide-react'

interface AvailableTransition {
  toState: WorkOrderStatus
  reasonRequired: boolean
}

interface InterventionRow {
  id: string
  technicianId: string
  startedAt: string | null
  endedAt: string | null
  diagnosis: string | null
  activities: string | null
  result: string | null
  laborMinutes: number | null
  laborCost: string | number | null
  technician: { name: string }
}

interface StopFormData {
  diagnosis: string
  activities: string
  result: string
}

const emptyStopForm: StopFormData = { diagnosis: '', activities: '', result: '' }

function elapsedLabel(startedAt: string, now: Date): string {
  const ms = now.getTime() - new Date(startedAt).getTime()
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function WorkOrderDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const workOrderId = params.id as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id as string | undefined

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [interventions, setInterventions] = useState<InterventionRow[]>([])
  const [transitions, setTransitions] = useState<AvailableTransition[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [showStopForm, setShowStopForm] = useState(false)
  const [stopForm, setStopForm] = useState<StopFormData>(emptyStopForm)
  const [pendingTransition, setPendingTransition] = useState<AvailableTransition | null>(null)
  const [transitionReason, setTransitionReason] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  const load = async () => {
    try {
      const woRes = await fetch(`/api/workorders/${workOrderId}`)
      if (woRes.ok) {
        setWorkOrder(await woRes.json())

        const [intRes, transRes] = await Promise.all([
          fetch(`/api/workorders/${workOrderId}/interventions`),
          fetch(`/api/workorders/${workOrderId}/transitions`),
        ])
        if (intRes.ok) setInterventions(await intRes.json())
        if (transRes.ok) setTransitions(await transRes.json())
      }
    } finally {
      setLoading(false)
    }
  }

  const submitTransition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingTransition) return
    if (pendingTransition.reasonRequired && !transitionReason.trim()) {
      setError('Motivo obrigatório para esta transição')
      return
    }
    setTransitioning(true)
    setError('')
    try {
      await transitionWorkOrderStateAction(workOrderId, pendingTransition.toState, transitionReason || undefined)
      setPendingTransition(null)
      setTransitionReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na transição de estado')
    } finally {
      setTransitioning(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId])

  const activeIntervention = useMemo(
    () => interventions.find((i) => i.technicianId === currentUserId && !i.endedAt),
    [interventions, currentUserId]
  )

  useEffect(() => {
    if (!activeIntervention) return
    const tick = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(tick)
  }, [activeIntervention])

  const startIntervention = async () => {
    if (!currentUserId) {
      setError('Sessão inválida. Faça login novamente.')
      return
    }
    setStarting(true)
    setError('')
    try {
      const res = await fetch(`/api/workorders/${workOrderId}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: currentUserId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao iniciar intervenção.')
        return
      }
      await load()
    } finally {
      setStarting(false)
    }
  }

  const submitStop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeIntervention) return
    setStopping(true)
    setError('')
    try {
      const res = await fetch(`/api/interventions/${activeIntervention.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: stopForm.diagnosis || undefined,
          activities: stopForm.activities || undefined,
          result: stopForm.result || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao terminar intervenção.')
        return
      }
      setStopForm(emptyStopForm)
      setShowStopForm(false)
      await load()
    } finally {
      setStopping(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }
  if (!workOrder) return <div className="p-8">OT não encontrada</div>

  const status = WORKORDER_STATUS[workOrder.status] || { ...FALLBACK_META, label: workOrder.status }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ClipboardList size={28} /> {workOrder.number}
        </h1>
        <p className="text-gray-500 mt-1">{workOrder.summary}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-6">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck size={18} /> Detalhes
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</dt>
                <dd className="mt-1">
                  <StatusBadge meta={status} />
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Prioridade</dt>
                <dd className="mt-1">
                  <StatusBadge meta={WORKORDER_PRIORITY[workOrder.priority] || { ...FALLBACK_META, badge: 'bg-gray-400 text-white', label: workOrder.priority }} />
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Origem</dt>
                <dd className="text-gray-800 mt-1">{workOrder.origin}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Aberto em</dt>
                <dd className="text-gray-800 mt-1">{formatDateTime(workOrder.openedAt)}</dd>
              </div>
              {workOrder.dueAt && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Prazo</dt>
                  <dd className="text-gray-800 mt-1">{formatDate(workOrder.dueAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {transitions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowRight size={18} /> Mudar Estado
              </h2>
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => {
                  const targetMeta = WORKORDER_STATUS[t.toState] || { ...FALLBACK_META, label: t.toState }
                  return (
                    <button
                      key={t.toState}
                      onClick={() => { setPendingTransition(t); setTransitionReason(''); setError('') }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${targetMeta.badge} hover:opacity-80`}
                    >
                      {targetMeta.label}
                    </button>
                  )
                })}
              </div>

              {pendingTransition && (
                <form onSubmit={submitTransition} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600">
                    Mudar para <strong>{(WORKORDER_STATUS[pendingTransition.toState] || { label: pendingTransition.toState }).label}</strong>
                    {workOrder.status === 'EM_INSPECCAO' && pendingTransition.toState === 'EM_REPARACAO' && ' — devolver para reparação (rejeitar qualidade)'}
                    {workOrder.status === 'EM_INSPECCAO' && pendingTransition.toState === 'RESOLVIDA' && ' — aprovar qualidade e fechar a OT'}
                  </p>
                  {pendingTransition.reasonRequired && (
                    <textarea
                      value={transitionReason}
                      onChange={(e) => setTransitionReason(e.target.value)}
                      required
                      rows={2}
                      placeholder="Motivo *"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={transitioning}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {transitioning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPendingTransition(null); setTransitionReason('') }}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {showStopForm && activeIntervention && (
            <form onSubmit={submitStop} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Square size={16} /> Terminar Intervenção
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  value={stopForm.diagnosis}
                  onChange={(e) => setStopForm({ ...stopForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actividades</label>
                <textarea
                  value={stopForm.activities}
                  onChange={(e) => setStopForm({ ...stopForm, activities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                <select
                  value={stopForm.result}
                  onChange={(e) => setStopForm({ ...stopForm, result: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="">Sem resultado por agora</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="REQUER_NOVA">Requer Nova Intervenção</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={stopping}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {stopping ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> A terminar...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Confirmar e Terminar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStopForm(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {interventions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench size={18} /> Intervenções <span className="text-xs font-normal text-gray-400">({interventions.length})</span>
              </h2>
              <div className="space-y-4">
                {interventions.map((int) => {
                  const resultMeta = int.result ? INTERVENTION_RESULT[int.result] : null
                  const isRunning = !int.endedAt
                  return (
                    <div key={int.id} className={`border-l-4 pl-4 pb-4 ${isRunning ? 'border-amber-400' : 'border-blue-400'}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{int.technician.name}</p>
                        {isRunning && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Timer size={11} /> Em curso
                          </span>
                        )}
                      </div>
                      {int.diagnosis && <p className="text-sm text-gray-700 mt-1">{int.diagnosis}</p>}
                      {int.activities && <p className="text-sm text-gray-600 mt-1">{int.activities}</p>}
                      {resultMeta && (
                        <div className="mt-2">
                          <StatusBadge meta={resultMeta} />
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {int.laborMinutes != null && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer size={12} /> {int.laborMinutes} min
                          </p>
                        )}
                        {int.laborCost != null && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Wallet size={12} /> {formatCurrency(int.laborCost)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {int.startedAt ? formatDateTime(new Date(int.startedAt)) : 'Não iniciada'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4">O Meu Trabalho</h2>

          {activeIntervention ? (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 ring-1 ring-amber-100 rounded-xl text-center">
                <Timer size={22} className="mx-auto text-amber-600 mb-1" />
                <p className="text-2xl font-bold text-amber-900 tabular-nums">
                  {elapsedLabel(activeIntervention.startedAt!, now)}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Iniciado às {formatDateTime(new Date(activeIntervention.startedAt!)).split(' ').pop()}
                </p>
              </div>
              <button
                onClick={() => setShowStopForm(true)}
                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Square size={15} /> Terminar Intervenção
              </button>
            </div>
          ) : (
            <button
              onClick={startIntervention}
              disabled={starting}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> A iniciar...
                </>
              ) : (
                <>
                  <Play size={15} /> Iniciar Intervenção
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

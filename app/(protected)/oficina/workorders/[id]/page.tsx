'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { WorkOrder, Intervention } from '@prisma/client'
import { formatDate, formatDateTime } from '@/lib/formatters'

interface InterventionFormData {
  diagnosis: string
  activities: string
  result: string
  laborMinutes: string
}

const emptyForm: InterventionFormData = {
  diagnosis: '',
  activities: '',
  result: '',
  laborMinutes: '',
}

const STATUS_META: Record<string, { emoji: string; accent: string }> = {
  ABERTA: { emoji: '🆕', accent: 'bg-blue-100 text-blue-800' },
  EM_CURSO: { emoji: '⏳', accent: 'bg-amber-100 text-amber-800' },
  EM_DIAGNOSTICO: { emoji: '🩺', accent: 'bg-purple-100 text-purple-800' },
  EM_REPARACAO: { emoji: '🔧', accent: 'bg-orange-100 text-orange-800' },
  AGUARDA_MATERIAL: { emoji: '📦', accent: 'bg-red-100 text-red-800' },
  EM_INSPECCAO: { emoji: '🔎', accent: 'bg-indigo-100 text-indigo-800' },
  RESOLVIDA: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800' },
}

const PRIORITY_META: Record<string, string> = {
  CRITICA: '🔴',
  ALTA: '🟠',
  MEDIA: '🟡',
  BAIXA: '🟢',
}

const RESULT_META: Record<string, { emoji: string; accent: string }> = {
  CONCLUIDA: { emoji: '✅', accent: 'bg-emerald-100 text-emerald-800' },
  PENDENTE: { emoji: '⏸️', accent: 'bg-gray-100 text-gray-800' },
  REQUER_NOVA: { emoji: '🔁', accent: 'bg-amber-100 text-amber-800' },
}

export default function WorkOrderDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const workOrderId = params.id as string

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<InterventionFormData>(emptyForm)

  const load = async () => {
    try {
      const woRes = await fetch(`/api/workorders/${workOrderId}`)
      if (woRes.ok) {
        const wo = await woRes.json()
        setWorkOrder(wo)

        const intRes = await fetch(`/api/workorders/${workOrderId}/interventions`)
        if (intRes.ok) {
          setInterventions(await intRes.json())
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId])

  const submitIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const technicianId = (session?.user as any)?.id
      if (!technicianId) {
        setError('Sessão inválida. Faça login novamente.')
        return
      }

      const res = await fetch(`/api/workorders/${workOrderId}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          diagnosis: form.diagnosis || undefined,
          activities: form.activities || undefined,
          result: form.result || undefined,
          laborMinutes: form.laborMinutes ? parseInt(form.laborMinutes) : undefined,
        }),
      })

      if (!res.ok) {
        setError('Erro ao registar intervenção.')
        return
      }

      setForm(emptyForm)
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">🛠️</div>
          <p className="text-sm">A carregar...</p>
        </div>
      </div>
    )
  }
  if (!workOrder) return <div className="p-8">❌ OT não encontrada</div>

  const status = STATUS_META[workOrder.status] || { emoji: '❔', accent: 'bg-gray-100 text-gray-800' }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span>🛠️</span> {workOrder.number}
        </h1>
        <p className="text-gray-500 mt-1">{workOrder.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">📋 Detalhes</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.accent}`}>
                    {status.emoji} {workOrder.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Prioridade</dt>
                <dd className="text-gray-800 mt-1">{PRIORITY_META[workOrder.priority] || '⚪'} {workOrder.priority}</dd>
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
                  <dd className="text-gray-800 mt-1">⏰ {formatDate(workOrder.dueAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {showForm && (
            <form onSubmit={submitIntervention} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">➕ Nova Intervenção</h2>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-100 text-red-800 rounded-xl text-sm">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🩺 Diagnóstico</label>
                <textarea
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🔧 Actividades</label>
                <textarea
                  value={form.activities}
                  onChange={(e) => setForm({ ...form, activities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🎯 Resultado</label>
                  <select
                    value={form.result}
                    onChange={(e) => setForm({ ...form, result: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="">Em curso...</option>
                    <option value="CONCLUIDA">✅ Concluída</option>
                    <option value="PENDENTE">⏸️ Pendente</option>
                    <option value="REQUER_NOVA">🔁 Requer Nova Intervenção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">⏱️ Tempo (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.laborMinutes}
                    onChange={(e) => setForm({ ...form, laborMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {saving ? '⏳ A guardar...' : '✓ Guardar Intervenção'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                🔧 Intervenções <span className="text-xs font-normal text-gray-400">({interventions.length})</span>
              </h2>
              <div className="space-y-4">
                {interventions.map((int) => {
                  const resultMeta = int.result ? RESULT_META[int.result] : null
                  return (
                    <div key={int.id} className="border-l-4 border-blue-400 pl-4 pb-4">
                      <p className="font-medium text-gray-900">{int.diagnosis || 'Sem diagnóstico'}</p>
                      {int.activities && <p className="text-sm text-gray-600 mt-1">{int.activities}</p>}
                      {resultMeta && (
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${resultMeta.accent}`}>
                          {resultMeta.emoji} {int.result}
                        </span>
                      )}
                      {int.laborMinutes && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">⏱️ {int.laborMinutes} min de trabalho</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {int.startedAt ? formatDateTime(int.startedAt) : 'Não iniciada'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">⚡ Acções</h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-4 py-2.5 text-left bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-medium text-blue-900 transition-colors"
            >
              {showForm ? '− Cancelar' : '➕ Adicionar Intervenção'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

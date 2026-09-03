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

  if (loading) return <div className="p-8">A carregar...</div>
  if (!workOrder) return <div className="p-8">OT não encontrada</div>

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{workOrder.number}</h1>
        <p className="text-gray-600 mt-2">{workOrder.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Estado</dt>
                <dd className="text-gray-600">{workOrder.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Prioridade</dt>
                <dd className="text-gray-600">{workOrder.priority}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Origem</dt>
                <dd className="text-gray-600">{workOrder.origin}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Aberto em</dt>
                <dd className="text-gray-600">{formatDateTime(workOrder.openedAt)}</dd>
              </div>
              {workOrder.dueAt && (
                <div>
                  <dt className="font-medium text-gray-700">Prazo</dt>
                  <dd className="text-gray-600">{formatDate(workOrder.dueAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {showForm && (
            <form onSubmit={submitIntervention} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Nova Intervenção</h2>
              {error && <div className="p-3 bg-red-100 text-red-800 rounded text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actividades</label>
                <textarea
                  value={form.activities}
                  onChange={(e) => setForm({ ...form, activities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                  <select
                    value={form.result}
                    onChange={(e) => setForm({ ...form, result: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Em curso...</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="REQUER_NOVA">Requer Nova Intervenção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.laborMinutes}
                    onChange={(e) => setForm({ ...form, laborMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'A guardar...' : 'Guardar Intervenção'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {interventions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Intervenções ({interventions.length})
              </h2>
              <div className="space-y-4">
                {interventions.map((int) => (
                  <div key={int.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <p className="font-medium text-gray-900">{int.diagnosis || 'Sem diagnóstico'}</p>
                    {int.activities && (
                      <p className="text-sm text-gray-600 mt-1">{int.activities}</p>
                    )}
                    {int.result && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {int.result}
                      </span>
                    )}
                    {int.laborMinutes && (
                      <p className="text-xs text-gray-500 mt-2">{int.laborMinutes} min de trabalho</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {int.startedAt ? formatDateTime(int.startedAt) : 'Não iniciada'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acções</h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-4 py-2 text-left bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium text-blue-900"
            >
              {showForm ? '− Cancelar' : '+ Adicionar Intervenção'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

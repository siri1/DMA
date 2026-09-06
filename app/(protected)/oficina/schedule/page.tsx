'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { WORKORDER_STATUS, WORKORDER_PRIORITY, FALLBACK_META, StatusBadge } from '@/lib/status-icons'
import {
  CalendarDays,
  Truck,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Check,
  X,
  GraduationCap,
  CalendarPlus,
  Loader2,
} from 'lucide-react'

interface AssetRef {
  assetCode: string
  description: string
}

interface TechRef {
  id: string
  name: string
}

interface ScheduledWorkOrder {
  id: string
  number: string
  summary: string
  status: string
  priority: string
  assetId: string
  asset: AssetRef
  assignedToId: string | null
  assignedTo: TechRef | null
  scheduledStart: string | null
  estimatedDurationMinutes: number | null
  requiredQualifications: string[]
}

interface ScheduleTechnician {
  id: string
  name: string
  qualifications: string[]
  absent: boolean
  absenceReason: string | null
  activeIntervention: { workOrderId: string; workOrderNumber: string; startedAt: string } | null
  scheduledMinutesToday: number
  scheduledCount: number
}

interface ScheduleData {
  scheduled: ScheduledWorkOrder[]
  unscheduled: ScheduledWorkOrder[]
  technicians: ScheduleTechnician[]
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function timeLabel(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function durationLabel(minutes: number | null): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}

export default function DailySchedulePage() {
  const [date, setDate] = useState(todayIso())
  const [data, setData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [gapWarning, setGapWarning] = useState<{
    workOrderId: string
    technicianId: string
    gap: string[]
    absent: boolean
    absenceReason: string | null
  } | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState({ time: '08:00', durationHours: '2' })
  const [markingAbsentId, setMarkingAbsentId] = useState<string | null>(null)
  const [absenceReasonDraft, setAbsenceReasonDraft] = useState('')
  const [absenceBusyId, setAbsenceBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/scheduling/daily?date=${date}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const availableTechnicians = data?.technicians.filter((t) => !t.absent) || []

  const submitMarkAbsent = async (technicianId: string) => {
    setAbsenceBusyId(technicianId)
    try {
      const res = await fetch(`/api/technicians/${technicianId}/absence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, reason: absenceReasonDraft || undefined }),
      })
      if (res.ok) {
        setMarkingAbsentId(null)
        setAbsenceReasonDraft('')
        await load()
      }
    } finally {
      setAbsenceBusyId(null)
    }
  }

  const submitMarkAvailable = async (technicianId: string) => {
    setAbsenceBusyId(technicianId)
    try {
      const res = await fetch(`/api/technicians/${technicianId}/absence`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (res.ok) await load()
    } finally {
      setAbsenceBusyId(null)
    }
  }

  const doAssign = async (workOrderId: string, technicianId: string, force = false) => {
    setAssigningId(workOrderId)
    try {
      const res = await fetch(`/api/workorders/${workOrderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, force }),
      })
      if (res.status === 409) {
        const body = await res.json()
        if (body.gap || body.absent) {
          setGapWarning({
            workOrderId,
            technicianId,
            gap: body.gap || [],
            absent: !!body.absent,
            absenceReason: body.absenceReason || null,
          })
          return
        }
      }
      if (res.ok) {
        setGapWarning(null)
        await load()
      }
    } finally {
      setAssigningId(null)
    }
  }

  const submitSchedule = async (workOrderId: string) => {
    const [h, m] = scheduleDraft.time.split(':').map(Number)
    const scheduledStart = new Date(`${date}T00:00:00`)
    scheduledStart.setHours(h || 0, m || 0, 0, 0)

    const res = await fetch(`/api/workorders/${workOrderId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledStart: scheduledStart.toISOString(),
        estimatedDurationMinutes: Math.round(parseFloat(scheduleDraft.durationHours || '1') * 60),
        requiredQualifications: [],
      }),
    })
    if (res.ok) {
      setSchedulingId(null)
      await load()
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <CalendarDays size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar escala...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarDays size={28} /> Escala Diária
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} /> Trabalho de Hoje ({data?.scheduled.length || 0})
              </h2>
            </div>
            {!data || data.scheduled.length === 0 ? (
              <p className="text-sm text-gray-400 p-6">Nenhuma OT agendada para este dia</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.scheduled.map((wo) => {
                  const statusMeta = WORKORDER_STATUS[wo.status] || { ...FALLBACK_META, label: wo.status }
                  const priorityMeta = WORKORDER_PRIORITY[wo.priority] || { ...FALLBACK_META, label: wo.priority }
                  const showGap = gapWarning?.workOrderId === wo.id

                  return (
                    <div key={wo.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-gray-400">{timeLabel(wo.scheduledStart)}</span>
                            <Link href={`/oficina/workorders/${wo.id}`} className="font-semibold text-gray-900 hover:text-blue-700">
                              {wo.number}
                            </Link>
                            <StatusBadge meta={statusMeta} />
                            <StatusBadge meta={priorityMeta} />
                          </div>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                            <Truck size={13} /> {wo.asset.assetCode} — {wo.asset.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Duração estimada: {durationLabel(wo.estimatedDurationMinutes)}
                          </p>
                          {wo.requiredQualifications.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <GraduationCap size={12} /> Requer: {wo.requiredQualifications.join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          {wo.assignedTo ? (
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 justify-end">
                              <UserCheck size={14} className="text-emerald-600" /> {wo.assignedTo.name}
                            </p>
                          ) : (
                            <select
                              disabled={assigningId === wo.id}
                              defaultValue=""
                              onChange={(e) => e.target.value && doAssign(wo.id, e.target.value)}
                              className="text-sm border border-amber-300 bg-amber-50 rounded-lg px-2 py-1.5"
                            >
                              <option value="" disabled>
                                ⚠️ Atribuir técnico
                              </option>
                              {availableTechnicians.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {showGap && (
                        <div className="mt-3 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl text-sm text-amber-900 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            {gapWarning.absent
                              ? `Indisponível${gapWarning.absenceReason ? ` — ${gapWarning.absenceReason}` : ''}`
                              : `Falta qualificação: ${gapWarning.gap.join(', ')}`}
                          </span>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => doAssign(gapWarning.workOrderId, gapWarning.technicianId, true)}
                              className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
                            >
                              Atribuir Mesmo Assim
                            </button>
                            <button onClick={() => setGapWarning(null)} className="text-amber-700 hover:text-amber-900">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CalendarPlus size={18} /> Por Agendar ({data?.unscheduled.length || 0})
              </h2>
            </div>
            {!data || data.unscheduled.length === 0 ? (
              <p className="text-sm text-gray-400 p-6">Sem OT por agendar</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.unscheduled.map((wo) => {
                  const priorityMeta = WORKORDER_PRIORITY[wo.priority] || { ...FALLBACK_META, label: wo.priority }
                  return (
                    <div key={wo.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/oficina/workorders/${wo.id}`} className="font-semibold text-gray-900 hover:text-blue-700">
                              {wo.number}
                            </Link>
                            <StatusBadge meta={priorityMeta} />
                          </div>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                            <Truck size={13} /> {wo.asset.assetCode} — {wo.asset.description}
                          </p>
                        </div>
                        {schedulingId === wo.id ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="time"
                              value={scheduleDraft.time}
                              onChange={(e) => setScheduleDraft({ ...scheduleDraft, time: e.target.value })}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                            />
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={scheduleDraft.durationHours}
                              onChange={(e) => setScheduleDraft({ ...scheduleDraft, durationHours: e.target.value })}
                              className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                              title="Duração (horas)"
                            />
                            <button
                              onClick={() => submitSchedule(wo.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Check size={16} />
                            </button>
                            <button onClick={() => setSchedulingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSchedulingId(wo.id)}
                            className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                          >
                            Agendar para hoje
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck size={18} /> Técnicos ({data?.technicians.length || 0})
          </h2>
          <div className="space-y-4">
            {data?.technicians.map((tech) => (
              <div key={tech.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm">{tech.name}</p>
                  {absenceBusyId === tech.id ? (
                    <Loader2 size={13} className="animate-spin text-gray-400 shrink-0" />
                  ) : tech.absent ? (
                    <button
                      onClick={() => submitMarkAvailable(tech.id)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-medium shrink-0"
                    >
                      Marcar Disponível
                    </button>
                  ) : (
                    <button
                      onClick={() => setMarkingAbsentId(markingAbsentId === tech.id ? null : tech.id)}
                      className="text-xs text-gray-400 hover:text-red-600 font-medium shrink-0"
                    >
                      Marcar Indisponível
                    </button>
                  )}
                </div>

                {tech.qualifications.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <GraduationCap size={11} /> {tech.qualifications.join(', ')}
                  </p>
                )}

                {tech.absent ? (
                  <p className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                    <UserX size={11} /> Indisponível{tech.absenceReason ? ` — ${tech.absenceReason}` : ''}
                  </p>
                ) : tech.activeIntervention ? (
                  <p className="text-xs text-blue-700 mt-1.5 flex items-center gap-1">
                    <Clock size={11} /> Em curso: {tech.activeIntervention.workOrderNumber}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 mt-1.5">Disponível agora</p>
                )}

                {!tech.absent && (
                  <p className="text-xs text-gray-400 mt-1">
                    {tech.scheduledCount} OT agendada(s) hoje — {durationLabel(tech.scheduledMinutesToday)}
                  </p>
                )}

                {markingAbsentId === tech.id && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={absenceReasonDraft}
                      onChange={(e) => setAbsenceReasonDraft(e.target.value)}
                      placeholder="Motivo (opcional)"
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1"
                      autoFocus
                    />
                    <button
                      onClick={() => submitMarkAbsent(tech.id)}
                      className="text-red-600 hover:text-red-800 shrink-0"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setMarkingAbsentId(null); setAbsenceReasonDraft('') }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(!data || data.technicians.length === 0) && (
              <p className="text-sm text-gray-400">Sem técnicos activos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

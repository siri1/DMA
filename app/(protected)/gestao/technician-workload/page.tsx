'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/formatters'
import { Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

const STANDARD_SHIFT_MINUTES = 8 * 60
const WEEKLY_LABEL = '40h'

interface DailyHours {
  date: string
  label: string
  minutes: number
}

interface TechnicianWorkload {
  technicianId: string
  name: string
  hourlyRate: number | null
  weekStart: string
  dailyHours: DailyHours[]
  totalMinutes: number
  totalHours: number
  targetHours: number
  utilizationPercent: number
  isOvertime: boolean
  interventionCount: number
  avgDurationMinutes: number
  totalLaborCost: number | null
}

function mondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function hoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

function utilizationColor(percent: number, isOvertime: boolean): string {
  if (isOvertime) return 'bg-red-500'
  if (percent >= 70) return 'bg-emerald-500'
  if (percent >= 40) return 'bg-amber-500'
  return 'bg-gray-300'
}

export default function TechnicianWorkloadPage() {
  const [week, setWeek] = useState(mondayOf(new Date()))
  const [data, setData] = useState<TechnicianWorkload[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/technicians/workload?week=${week}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [week])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const overworked = data?.filter((t) => t.isOvertime) || []
  const underutilized = data?.filter((t) => !t.isOvertime && t.utilizationPercent < 40) || []

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sm">A carregar carga de trabalho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp size={28} /> Carga de Trabalho dos Técnicos
        </h1>
        <input
          type="date"
          value={week}
          onChange={(e) => setWeek(mondayOf(new Date(e.target.value)))}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
        />
      </div>

      {(overworked.length > 0 || underutilized.length > 0) && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {overworked.length > 0 && (
            <div className="p-4 bg-red-50 ring-1 ring-red-100 rounded-2xl">
              <p className="text-sm font-medium text-red-900 flex items-center gap-1.5 mb-1">
                <AlertTriangle size={15} /> Acima da capacidade semanal ({WEEKLY_LABEL})
              </p>
              <p className="text-sm text-red-700">{overworked.map((t) => t.name).join(', ')}</p>
            </div>
          )}
          {underutilized.length > 0 && (
            <div className="p-4 bg-amber-50 ring-1 ring-amber-100 rounded-2xl">
              <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5 mb-1">
                <Clock size={15} /> Baixa utilização (&lt;40%)
              </p>
              <p className="text-sm text-amber-700">{underutilized.map((t) => t.name).join(', ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {data?.map((tech) => (
          <div key={tech.technicianId} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{tech.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tech.interventionCount} intervenç{tech.interventionCount === 1 ? 'ão' : 'ões'} concluída(s) — média{' '}
                  {hoursLabel(tech.avgDurationMinutes)} cada
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${tech.isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                  {tech.totalHours}h / {tech.targetHours}h
                </p>
                <p className="text-xs text-gray-400">{tech.utilizationPercent}% de utilização</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${utilizationColor(tech.utilizationPercent, tech.isOvertime)}`}
                style={{ width: `${Math.min(100, tech.utilizationPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-7 gap-2">
              {tech.dailyHours.map((day) => (
                <div key={day.date} className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{day.label}</p>
                  <div className="h-16 bg-gray-50 rounded-lg flex items-end p-1">
                    <div
                      className="w-full bg-blue-500 rounded"
                      style={{ height: `${Math.min(100, (day.minutes / (STANDARD_SHIFT_MINUTES)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{day.minutes > 0 ? hoursLabel(day.minutes) : '—'}</p>
                </div>
              ))}
            </div>

            {tech.totalLaborCost !== null && (
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
                Custo de mão-de-obra esta semana: {formatCurrency(tech.totalLaborCost)}
                {tech.hourlyRate !== null && ` (${formatCurrency(tech.hourlyRate)}/h)`}
              </p>
            )}
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="bg-white p-12 rounded-2xl shadow-sm ring-1 ring-gray-100 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">Sem técnicos activos</p>
          </div>
        )}
      </div>
    </div>
  )
}

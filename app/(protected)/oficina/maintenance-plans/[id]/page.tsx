'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/formatters'
import {
  MaintenancePlanForm,
  type MaintenancePlanFormValues,
} from '@/components/domain/MaintenancePlanForm'
import { MAINTENANCE_TYPE, FALLBACK_META } from '@/lib/status-icons'
import { ArrowLeft, Pencil, X, ClipboardList, Repeat, AlertOctagon, Calendar, Truck } from 'lucide-react'

interface PlanDetail extends MaintenancePlanFormValues {
  assetId: string
  asset: { description: string; assetCode: string; family: string | null }
}

export default function MaintenancePlanDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/maintenance-plans/${id}`)
        if (res.ok) {
          setPlan(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [id])

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
  if (!plan) return <div className="p-8">Plano não encontrado</div>

  const isOverdue = new Date(plan.nextDueAt) < new Date()
  const typeMeta = MAINTENANCE_TYPE[plan.type] || { ...FALLBACK_META, label: plan.type }
  const TypeIcon = typeMeta.icon

  return (
    <div className="p-8">
      <Link href="/oficina/maintenance-plans" className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TypeIcon size={28} /> {plan.asset.description}
          </h1>
          <p className="text-gray-500 mt-1">{typeMeta.label}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors flex items-center gap-2"
        >
          {editing ? (
            <>
              <X size={16} /> Cancelar
            </>
          ) : (
            <>
              <Pencil size={16} /> Editar
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
              <MaintenancePlanForm
                plan={plan}
                onSuccess={() => {
                  setEditing(false)
                  window.location.reload()
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList size={18} /> Detalhes
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Tipo</dt>
                  <dd className="text-gray-800 mt-1 flex items-center gap-1.5">
                    <TypeIcon size={14} /> {typeMeta.label}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Periodicidade</dt>
                  <dd className="text-gray-800 mt-1 flex items-center gap-1.5">
                    <Repeat size={14} /> Cada {plan.periodicityDays} dias
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Próxima Manutenção</dt>
                  <dd className={`font-medium mt-1 flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                    {isOverdue ? <AlertOctagon size={14} /> : <Calendar size={14} />} {formatDate(new Date(plan.nextDueAt))}
                    {isOverdue && ' (VENCIDA)'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${plan.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {plan.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={18} /> Equipamento
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Código</dt>
              <dd className="text-gray-800 mt-0.5 font-mono">{plan.asset.assetCode}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide">Família</dt>
              <dd className="text-gray-800 mt-0.5">{plan.asset.family || '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href={`/oficina/assets/${plan.assetId}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Truck size={16} /> Ver Equipamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

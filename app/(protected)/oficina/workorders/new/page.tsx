'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkOrderForm } from '@/components/domain/WorkOrderForm'
import { ClipboardList } from 'lucide-react'

function NewWorkOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetAssetId = searchParams.get('assetId') || undefined

  return (
    <WorkOrderForm
      assetId={presetAssetId}
      onSuccess={(workOrderId) => {
        router.push(`/oficina/workorders/${workOrderId}`)
      }}
    />
  )
}

export default function NewWorkOrderPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <ClipboardList size={28} /> Nova Ordem de Trabalho
      </h1>
      <p className="text-gray-500 mb-8">Criar uma nova tarefa de manutenção</p>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
        <Suspense fallback={<p className="text-sm text-gray-400">A carregar...</p>}>
          <NewWorkOrderForm />
        </Suspense>
      </div>
    </div>
  )
}

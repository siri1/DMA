import { WorkOrderForm } from '@/components/domain/WorkOrderForm'

export default function NewWorkOrderPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Ordem de Trabalho</h1>
      <p className="text-gray-600 mb-8">Criar uma nova tarefa de manutenção</p>

      <div className="bg-white rounded-lg shadow p-6">
        <WorkOrderForm
          onSuccess={() => {
            typeof window !== 'undefined' &&
              (window.location.href = '/oficina/workorders')
          }}
        />
      </div>
    </div>
  )
}

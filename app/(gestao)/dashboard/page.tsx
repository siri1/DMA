export default function GestaoDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Painel de Gestão</h1>
      <p className="text-gray-600 mt-2">Monitorize a operação da manutenção e peças.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Equipamentos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">OT Abertas</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Tempo Médio</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">4,2 dias</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Taxa Resolução</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">85%</p>
        </div>
      </div>
    </div>
  )
}

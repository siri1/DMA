export default function ArmazemDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Armazém de Peças</h1>
      <p className="text-gray-600 mt-2">Gerencie artigos, stocks e requisições.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Artigos Activos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Abaixo do Mínimo</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Requisições</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Valor Stock</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">1 200 000 Kz</p>
        </div>
      </div>
    </div>
  )
}

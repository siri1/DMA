export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
      <p className="text-gray-600 mt-2">Gerencie utilizadores e configurações do sistema.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Utilizadores Activos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">6</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Logs de Auditoria</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">142</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Espaço BD</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">245 MB</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className="text-lg font-bold text-green-600 mt-2">✓ Online</p>
        </div>
      </div>
    </div>
  )
}

import { ReactNode } from 'react'

export default function GestaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-8">Gestão</h2>
        <nav className="space-y-4">
          <a href="/gestao/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800">Painel</a>
          <a href="/gestao/executive" className="block px-4 py-2 rounded hover:bg-gray-800">Dashboard Executivo</a>
          <a href="/gestao/operational" className="block px-4 py-2 rounded hover:bg-gray-800">Dashboard Operacional</a>
          <a href="/gestao/audit" className="block px-4 py-2 rounded hover:bg-gray-800">Auditoria</a>
          <a href="/gestao/users" className="block px-4 py-2 rounded hover:bg-gray-800">Utilizadores</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

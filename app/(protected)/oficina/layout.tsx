import { ReactNode } from 'react'

export default function OficinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-8">Oficina DMA</h2>
        <nav className="space-y-4">
          <a
            href="/oficina/assets"
            className="block px-4 py-2 rounded hover:bg-gray-800"
          >
            Equipamentos
          </a>
          <a
            href="/oficina/workorders"
            className="block px-4 py-2 rounded hover:bg-gray-800"
          >
            Ordens de Trabalho
          </a>
          <a
            href="/oficina/maintenance-plans"
            className="block px-4 py-2 rounded hover:bg-gray-800"
          >
            Planos de Manutenção
          </a>
          <a
            href="/oficina/requisitions"
            className="block px-4 py-2 rounded hover:bg-gray-800"
          >
            Requisições
          </a>
          <a
            href="/oficina/quarantine"
            className="block px-4 py-2 rounded hover:bg-gray-800"
          >
            Quarentena
          </a>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

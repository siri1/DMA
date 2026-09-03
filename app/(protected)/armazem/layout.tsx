import { ReactNode } from 'react'

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-8">Armazém de Peças</h2>
        <nav className="space-y-4">
          <a href="/armazem/inventory" className="block px-4 py-2 rounded hover:bg-gray-800">Stocks e Artigos</a>
          <a href="/armazem/receipts" className="block px-4 py-2 rounded hover:bg-gray-800">Recepção</a>
          <a href="/armazem/purchases" className="block px-4 py-2 rounded hover:bg-gray-800">Compras e Fornecedores</a>
          <a href="/armazem/counts" className="block px-4 py-2 rounded hover:bg-gray-800">Inventário e Localizações</a>
          <a href="/oficina/requisitions" className="block px-4 py-2 rounded hover:bg-gray-800">Requisições</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

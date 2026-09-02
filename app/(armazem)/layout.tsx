import { ReactNode } from 'react'

export default function ArmazemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-8">Armazém de Peças</h2>
        <nav className="space-y-4">
          <a href="/armazem/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800">Painel</a>
          <a href="/armazem/items" className="block px-4 py-2 rounded hover:bg-gray-800">Artigos</a>
          <a href="/armazem/stocks" className="block px-4 py-2 rounded hover:bg-gray-800">Stocks</a>
          <a href="/armazem/requisitions" className="block px-4 py-2 rounded hover:bg-gray-800">Requisições</a>
          <a href="/armazem/purchases" className="block px-4 py-2 rounded hover:bg-gray-800">Compras</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

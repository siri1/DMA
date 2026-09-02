'use client'

import { useEffect, useState } from 'react'

export default function PainelTV() {
  const [currentPage, setCurrentPage] = useState(0)
  const pages = [
    { title: 'Ordens Abertas', count: 2, color: 'bg-red-600' },
    { title: 'Em Reparação', count: 1, color: 'bg-yellow-600' },
    { title: 'Em Diagnóstico', count: 1, color: 'bg-blue-600' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pages.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const page = pages[currentPage]

  return (
    <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
      <div
        className={`text-center ${page.color} w-full h-full flex flex-col items-center justify-center`}
      >
        <h1 className="text-9xl font-bold text-white mb-8">{page.count}</h1>
        <h2 className="text-6xl text-white font-light">{page.title}</h2>
        <div className="mt-20 text-white text-2xl">
          {currentPage + 1} de {pages.length}
        </div>
      </div>
    </div>
  )
}

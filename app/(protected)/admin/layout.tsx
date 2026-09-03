'use client'

import { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar title="Administração" icon={Settings} accent="from-slate-700 to-slate-900" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

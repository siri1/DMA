'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import type { UserRole } from '@prisma/client'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  GESTAO: 'Gestão',
}

export function HubHeader({ userName, role }: { userName: string; role: UserRole }) {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-lg font-bold text-white">DMA App</h1>
          <p className="text-sm text-slate-400">
            Bem-vindo, {userName} · {ROLE_LABELS[role] || role}
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut({ redirect: false })
            window.location.href = '/login'
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={15} /> Sair
        </button>
      </div>
    </header>
  )
}

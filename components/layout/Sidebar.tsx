'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  title: string
  icon: LucideIcon
  items: NavItem[]
  accent?: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OFICINA: 'Oficina',
  ARMAZEM: 'Armazém',
  GESTAO: 'Gestão',
  CLIENTE_INTERNO: 'Cliente Interno',
  PAINEL: 'Painel',
}

export function Sidebar({ title, icon: HeaderIcon, items, accent = 'from-indigo-600 to-indigo-800' }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role as string | undefined
  const userName = session?.user?.name

  return (
    <aside className="w-64 flex flex-col bg-gray-950 text-white overflow-y-auto shrink-0">
      <div className={`bg-gradient-to-br ${accent} p-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <HeaderIcon size={22} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            <p className="text-xs text-white/70">DMA Vision</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        {userName && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            {role && <p className="text-xs text-gray-400">{ROLE_LABELS[role] || role}</p>}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, LayoutGrid, type LucideIcon } from 'lucide-react'
import type { UserRole } from '@prisma/client'
import { hasPermission } from '@/lib/rbac'
import type { NavGroup } from './nav-config'
import { MODULE_ACCESS } from '@/lib/modules'

interface SidebarProps {
  title: string
  icon: LucideIcon
  accent?: string
  /** This module's own nav list only — DMA_VISION_NAV or PECAS_NAV. Each
   * layout is walled off from the other; nothing here ever links into the
   * other module's pages. Switching modules happens only via the Hub. */
  navGroups: NavGroup[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OFICINA: 'Oficina',
  ARMAZEM: 'Armazém',
  GESTAO: 'Gestão',
  CLIENTE_INTERNO: 'Cliente Interno',
  PAINEL: 'Painel',
}

export function Sidebar({ title, icon: HeaderIcon, accent = 'from-indigo-600 to-indigo-800', navGroups }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role as UserRole | undefined
  const userName = session?.user?.name

  // Items within this module's own nav are still filtered by RBAC per
  // viewer - the wall is about which list a layout passes in, not a
  // second permission system.
  const visibleGroups = role
    ? navGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPermission(role, item.module, item.permission || 'view')),
      })).filter((group) => group.items.length > 0)
    : []

  const canSwitchModule = role ? MODULE_ACCESS[role].length > 1 : false

  return (
    <aside className="w-64 flex flex-col bg-gray-950 text-white overflow-y-auto shrink-0">
      <div className="bg-white px-6 py-3 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/kwanda-logo.jpg" alt="KWANDA, Lda." className="h-9 w-9 rounded-lg object-cover" />
      </div>

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

      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        {canSwitchModule && (
          <Link
            href="/hub"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LayoutGrid size={16} strokeWidth={2} />
            <span>Trocar de Módulo</span>
          </Link>
        )}
        {userName && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            {role && <p className="text-xs text-gray-400">{ROLE_LABELS[role] || role}</p>}
          </div>
        )}
        <button
          onClick={async () => {
            // Explicit two-step signout: wait for the session cookie to be
            // cleared server-side, then force a hard navigation (not a
            // client-side router transition) so no stale RSC/session state
            // can be served from cache.
            await signOut({ redirect: false })
            window.location.href = '/login'
          }}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </aside>
  )
}

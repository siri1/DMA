'use client'

import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Sidebar } from './Sidebar'
import type { NavGroup } from './nav-config'

interface AppShellProps {
  title: string
  icon: LucideIcon
  accent?: string
  navGroups: NavGroup[]
  children: ReactNode
}

/**
 * Responsive wrapper around Sidebar, used by every protected layout
 * (oficina/armazem/gestao/admin). Below the `lg` breakpoint the sidebar
 * becomes an off-canvas drawer opened by a hamburger button in a mobile top
 * bar, instead of the fixed 256px column permanently eating most of a
 * phone-width screen. All four layouts share this one shell so the mobile
 * behaviour can't drift between them.
 */
export function AppShell({ title, icon, accent, navGroups, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 h-full transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar title={title} icon={icon} accent={accent} navGroups={navGroups} onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="p-1.5 -ml-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900 text-sm truncate">{title}</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

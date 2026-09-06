import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getModulesForRole, getModuleEntryPath } from '@/lib/modules'
import { ModuleCard } from './ModuleCard'
import { HubHeader } from './HubHeader'
import type { UserRole } from '@prisma/client'

export default async function ModuleHubPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role as UserRole
  const modules = getModulesForRole(role)

  // PAINEL never sees the hub (chromeless TV board only); a role with a
  // single module skips the choice screen entirely and lands directly.
  if (modules.length <= 1) {
    const target = modules.length === 1 ? getModuleEntryPath(modules[0].id, role) : '/painel'
    redirect(target)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <HubHeader userName={session.user.name || ''} role={role} />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">Escolha o módulo</h2>
          <p className="text-slate-400 text-sm mt-1">Pode alternar entre módulos a qualquer momento</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} href={getModuleEntryPath(module.id, role)} />
          ))}
        </div>
      </main>
    </div>
  )
}

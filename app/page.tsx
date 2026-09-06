import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Every role lands on the equipment-status overview (Dashboard
  // Operacional) right after login, except:
  // - PAINEL, which always goes to the chromeless TV board (/painel) —
  //   it must never see the interactive dashboard shell.
  // - CLIENTE_INTERNO, who lacks 'workorders:view' (see lib/rbac.ts) and
  //   would get a 403 from /api/dashboard/metrics; sent to the read-only
  //   equipment list instead, which their role can actually view.
  // Note: (protected) is a route GROUP - it does NOT appear in the URL.
  // Verified against actual `npm run build` route output.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role
  switch (role) {
    case 'PAINEL':
      redirect('/painel')
    case 'CLIENTE_INTERNO':
      redirect('/oficina/assets')
    case 'ADMIN':
    case 'OFICINA':
    case 'ARMAZEM':
    case 'GESTAO':
    default:
      redirect('/gestao/dashboard-ops')
  }
}

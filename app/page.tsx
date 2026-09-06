import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { UserRole } from '@prisma/client'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role as UserRole

  // Every role lands on the Executive Dashboard on login, except the two
  // where that would actually break something rather than just be a
  // different view:
  //  - PAINEL is the chromeless TV-kiosk account for /painel; it has no
  //    input for the dashboard's date filters and shouldn't render a full
  //    interactive page.
  //  - CLIENTE_INTERNO must never see costs (CLAUDE.md sec4) - the
  //    executive dashboard shows stock value, and 'workorders:view' (which
  //    the dashboard API requires) deliberately excludes this role anyway.
  //  - ARMAZEM's only module is Modulo de Pecas; the dashboard lives inside
  //    DMA Vision's sidebar (gestao/layout.tsx, DMA_VISION_NAV), which
  //    ARMAZEM has no permission to see any item of, and it can't have only
  //    one module and also get a "Trocar de Modulo" escape hatch. Landing
  //    it there would show an all-but-empty sidebar with no way back.
  if (role === 'PAINEL') {
    redirect('/painel')
  }
  if (role === 'CLIENTE_INTERNO') {
    redirect('/oficina/assets')
  }
  if (role === 'ARMAZEM') {
    redirect('/armazem/inventory')
  }

  redirect('/gestao/dashboard-exec')
}

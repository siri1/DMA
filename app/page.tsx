import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // All role-based landing logic (hub vs. direct redirect for single/zero
  // -module roles) lives in one place: app/hub/page.tsx + lib/modules.ts.
  redirect('/hub')
}

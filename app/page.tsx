import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect based on role
  // Note: (protected) is a route GROUP - it does NOT appear in the URL.
  // Verified against actual `npm run build` route output.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role
  switch (role) {
    case 'OFICINA':
      redirect('/oficina/assets')
    case 'ARMAZEM':
      redirect('/armazem/inventory')
    case 'GESTAO':
      redirect('/gestao/dashboard-exec')
    case 'PAINEL':
      redirect('/painel')
    case 'ADMIN':
    default:
      redirect('/admin/users')
  }
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect based on role to protected routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role
  switch (role) {
    case 'OFICINA':
      redirect('/protected/oficina/assets')
    case 'ARMAZEM':
      redirect('/protected/armazem/inventory')
    case 'GESTAO':
      redirect('/protected/gestao/dashboard-exec')
    case 'PAINEL':
      redirect('/protected/painel')
    case 'ADMIN':
    default:
      redirect('/protected/admin/users')
  }
}

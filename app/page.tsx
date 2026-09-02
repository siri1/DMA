import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect based on role
  const role = (session.user as any).role
  switch (role) {
    case 'OFICINA':
      redirect('/oficina/assets')
    case 'ARMAZEM':
      redirect('/armazem/dashboard')
    case 'GESTAO':
      redirect('/gestao/dashboard')
    case 'PAINEL':
      redirect('/painel')
    case 'ADMIN':
    default:
      redirect('/admin/dashboard')
  }
}

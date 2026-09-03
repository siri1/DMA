import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  return Response.json({
    session: session ? { user: session.user, expires: session.expires } : null,
    hasSession: !!session,
  })
}

import { auth } from '@/lib/auth'

export default auth((req) => {
  // Routes that require auth
  const protectedRoutes = ['/admin', '/gestao', '/oficina', '/armazem', '/painel']
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api).*)',
  ],
}

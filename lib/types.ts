import type { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
  }

  interface Session {
    user: User & {
      role: UserRole
      id: string
    }
  }
}

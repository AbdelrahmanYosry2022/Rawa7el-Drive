import { type NextRequest } from 'next/server'
import { updateSession } from '@rawa7el/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/students/:path*',
    '/lectures/:path*',
    '/calendar/:path*',
    '/attendance/:path*',
    '/library/:path*',
    '/reports/:path*',
    '/invitations/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/subjects/:path*',
    '/materials/:path*',
    '/halaqat/:path*',
  ],
}

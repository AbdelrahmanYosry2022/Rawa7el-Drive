import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@rawa7el/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow register page without any auth check
  if (pathname === '/register' || pathname.startsWith('/register/') || pathname.startsWith('/register?')) {
    return NextResponse.next()
  }
  
  // Allow invitation validation API
  if (pathname.startsWith('/api/invitations')) {
    return NextResponse.next()
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

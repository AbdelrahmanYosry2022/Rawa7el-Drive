import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

// Admin-only routes that students cannot access
const ADMIN_ROUTES = [
  '/dashboard',
  '/students',
  '/lectures',
  '/calendar',
  '/attendance',
  '/library',
  '/reports',
  '/invitations',
  '/admin',
  '/teacher',
  '/subjects',
  '/materials',
  '/halaqat',
  '/activities-platform',
  '/exams-platform',
  '/resources-platform',
]

// Routes accessible by students
const STUDENT_ROUTES = [
  '/welcome',
  '/api',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  const isPublicPage =
    request.nextUrl.pathname.startsWith('/attendance/checkin') ||
    request.nextUrl.pathname.startsWith('/api/attendance/checkin') ||
    request.nextUrl.pathname.startsWith('/api/invitations/validate')

  const isDummyMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
  const hasDummyAuth = request.cookies.get('dummy-auth')?.value === 'true'

  if (!user && !isAuthPage && !isPublicPage) {
    // Allow access if we are in dummy mode and have the dummy auth cookie
    if (isDummyMode && hasDummyAuth) {
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role-based access control for authenticated users
  if (user && !isAuthPage && !isPublicPage) {
    const pathname = request.nextUrl.pathname
    
    // Check if trying to access admin route
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    
    if (isAdminRoute) {
      // Fetch user role from database
      const { data: profile } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = (profile as any)?.role

      // If user is STUDENT or TEACHER (not admin), redirect to welcome page
      if (!userRole || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        const url = request.nextUrl.clone()
        url.pathname = '/welcome'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

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

  const isDummyMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
  const hasDummyAuth = request.cookies.get('dummy-auth')?.value === 'true'

  let supabase: any;

  if (isDummyMode) {
    const createMockBuilder = (table: string) => {
      const resultData = table === 'User' ? {
             id: 'dummy-user-id',
             role: 'ADMIN',
             platform: 'TAHT_EL_ESHREEN'
           } : []

      return {
        then: (onfulfilled: any, onrejected: any) => {
          return Promise.resolve({ data: resultData, error: null }).then(onfulfilled, onrejected)
        },
        select: function() { return this },
        eq: function() { return this },
        single: async function() {
          const item = Array.isArray(resultData) ? resultData[0] : resultData
          return { data: item || null, error: null }
        },
        maybeSingle: async function() {
          const item = Array.isArray(resultData) ? resultData[0] : resultData
          return { data: item || null, error: null }
        }
      }
    }

    supabase = {
      auth: {
        getUser: async () => {
          if (hasDummyAuth) {
            return {
              data: {
                user: {
                  id: 'dummy-user-id',
                  email: 'dummy@example.com',
                  role: 'authenticated'
                }
              },
              error: null
            }
          }
          return { data: { user: null }, error: null }
        }
      },
      from: (table: string) => createMockBuilder(table)
    }
  } else {
    supabase = createServerClient<Database>(
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
  }

  // IMPORTANT: Do not add code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === '/login' || pathname.startsWith('/login/') || 
                     pathname === '/register' || pathname.startsWith('/register/')
  const isPublicPage =
    pathname.startsWith('/attendance/checkin') ||
    pathname.startsWith('/api/attendance/checkin') ||
    pathname.startsWith('/api/invitations/validate') ||
    pathname.startsWith('/api/invitations')

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
    // Check if trying to access admin route
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    
    if (isAdminRoute) {
      // Fetch user role from database
      const { data: profile } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const userRole = profile?.role

      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        const url = request.nextUrl.clone()
        url.pathname = '/' // Redirect to student dashboard
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

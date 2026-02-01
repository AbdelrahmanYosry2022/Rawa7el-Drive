import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  // Bypass for dummy mode
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    const hasDummyAuth = cookieStore.get('dummy-auth')?.value === 'true'

    const createMockBuilder = (table: string) => {
      const getData = () => {
        if (table === 'User') {
           return {
             id: 'dummy-user-id',
             email: 'dummy@example.com',
             name: 'مستخدم تجريبي',
             role: 'ADMIN',
             platform: 'TAHT_EL_ESHREEN',
             isActive: true,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
           }
        }
        if (table === 'Subject') {
          return [
            { id: '1', name: 'اللغة العربية', color: 'blue', createdAt: new Date().toISOString() },
            { id: '2', name: 'الرياضيات', color: 'red', createdAt: new Date().toISOString() }
          ]
        }
        return []
      }

      const resultData = getData()

      return {
        then: (onfulfilled: any, onrejected: any) => {
          return Promise.resolve({ 
            data: resultData, 
            count: Array.isArray(resultData) ? resultData.length : null,
            error: null 
          }).then(onfulfilled, onrejected)
        },
        select: function() { return this },
        eq: function() { return this },
        neq: function() { return this },
        gt: function() { return this },
        gte: function() { return this },
        lt: function() { return this },
        lte: function() { return this },
        like: function() { return this },
        ilike: function() { return this },
        is: function() { return this },
        in: function() { return this },
        contains: function() { return this },
        order: function() { return this },
        limit: function() { return this },
        range: function() { return this },
        single: async function() {
          const item = Array.isArray(resultData) ? resultData[0] : resultData
          if (!item) return { data: null, error: { message: 'Not found', code: 'PGRST116' } }
          return { data: item, error: null }
        },
        maybeSingle: async function() {
          const item = Array.isArray(resultData) ? resultData[0] : resultData
          return { data: item || null, error: null }
        },
        insert: async function(data: any) {
           return { data: data, error: null }
        },
        update: async function(data: any) {
           return { data: data, error: null }
        },
        delete: async function() {
           return { data: null, error: null }
        },
        url: { href: '' }
      }
    }

    // Mock Supabase Client
    return {
      auth: {
        getUser: async () => {
          if (hasDummyAuth) {
            return {
              data: {
                user: {
                  id: 'dummy-user-id',
                  email: 'dummy@example.com',
                  app_metadata: { provider: 'email' },
                  user_metadata: {},
                  aud: 'authenticated',
                  created_at: new Date().toISOString(),
                  role: 'authenticated'
                }
              },
              error: null
            }
          }
          return { data: { user: null }, error: null }
        },
        getSession: async () => {
          if (hasDummyAuth) {
            return {
              data: {
                session: {
                  access_token: 'dummy-token',
                  refresh_token: 'dummy-refresh',
                  expires_in: 3600,
                  token_type: 'bearer',
                  user: {
                    id: 'dummy-user-id',
                    email: 'dummy@example.com',
                    app_metadata: { provider: 'email' },
                    user_metadata: {},
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                    role: 'authenticated'
                  }
                }
              },
              error: null
            }
          }
          return { data: { session: null }, error: null }
        },
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: (table: string) => createMockBuilder(table)
    } as any
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

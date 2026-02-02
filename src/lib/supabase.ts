import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Force mock if URL is missing or is a placeholder
const isMock = !supabaseUrl || supabaseUrl === '' || supabaseUrl.includes('placeholder')

// Mock user data
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'admin@rawa7el.com',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
}

const MOCK_DB_USER = {
  id: 'mock-user-id',
  role: 'ADMIN',
  name: 'Admin User',
  email: 'admin@rawa7el.com'
}

// Simple in-memory store
const mockStore: Record<string, any[]> = {
  students: []
}

const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      if (email === 'admin@rawa7el.com' && password === '123456') {
        localStorage.setItem('mock-auth', 'true')
        return { data: { user: MOCK_USER, session: { user: MOCK_USER } }, error: null }
      }
      return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }
    },
    getUser: async () => {
      const isLoggedIn = localStorage.getItem('mock-auth') === 'true'
      if (isLoggedIn) {
        return { data: { user: MOCK_USER }, error: null }
      }
      return { data: { user: null }, error: { message: 'Not logged in' } }
    },
    signOut: async () => {
      localStorage.removeItem('mock-auth')
      return { error: null }
    },
    getSession: async () => {
      const isLoggedIn = localStorage.getItem('mock-auth') === 'true'
      if (isLoggedIn) {
        return { data: { session: { user: MOCK_USER, access_token: 'mock-token' } }, error: null }
      }
      return { data: { session: null }, error: null }
    },
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  from: (table: string) => {
    let queryData = mockStore[table] || []
    let resultCount: number | null = null
    let currentOp = 'select'

    const chain = {
      select: (columns: any = '*', options?: { count?: string, head?: boolean }) => {
        currentOp = 'select'
        if (options?.count) {
          resultCount = queryData.length
        }
        if (options?.head) {
          queryData = []
        }
        return chain
      },
      eq: (column: string, value: any) => {
        queryData = queryData.filter((item: any) => item[column] === value)
        return chain
      },
      order: (column: string, { ascending = true } = {}) => {
        queryData = [...queryData].sort((a: any, b: any) => {
          if (a[column] < b[column]) return ascending ? -1 : 1
          if (a[column] > b[column]) return ascending ? 1 : -1
          return 0
        })
        return chain
      },
      limit: (n: number) => {
        queryData = queryData.slice(0, n)
        return chain
      },
      single: async () => {
        if (table === 'User') {
          return { data: MOCK_DB_USER, error: null }
        }
        return { data: queryData[0] || null, error: queryData.length === 0 ? { message: 'Not found' } : null }
      },
      maybeSingle: async () => {
        if (table === 'User') {
          return { data: MOCK_DB_USER, error: null }
        }
        return { data: queryData[0] || null, error: null }
      },
      insert: async (data: any | any[]) => {
        const items = Array.isArray(data) ? data : [data]
        const newItems = items.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...item
        }))
        
        if (!mockStore[table]) mockStore[table] = []
        mockStore[table].push(...newItems)
        
        return { data: newItems, error: null }
      },
      update: (data: any) => {
        currentOp = 'update'
        // We'll apply the update in 'then'
        // But for now, since we don't have the update data stored in the chain for 'then',
        // let's just do a simple hack: update queryData in place and return async result-like object that is also a chain?
        // No, proper way is to store data.
        // For simplicity in this fix, we will just support delete properly first.
        return chain
      },
      upsert: async () => ({ data: null, error: null }),
      delete: () => {
        currentOp = 'delete'
        return chain
      },
      // Make chain thenable to support await directly
      then: (resolve: any) => {
        if (currentOp === 'delete') {
          const idsToDelete = queryData.map((d: any) => d.id)
          if (mockStore[table]) {
            mockStore[table] = mockStore[table].filter((d: any) => !idsToDelete.includes(d.id))
          }
          resolve({ data: queryData, error: null })
        } else {
          resolve({ data: queryData, count: resultCount, error: null })
        }
      }
    }
    return chain
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: async () => ({ data: null, error: null })
    })
  },
  channel: (name: string) => {
    const channelMock = {
      on: function (type: string, filter: any, callback: (payload: any) => void) { return this },
      subscribe: function () { return this }
    }
    return channelMock
  },
  removeChannel: (channel: any) => { }
}

export const supabase = isMock ? (mockSupabase as any) : createSupabaseClient(supabaseUrl, supabaseAnonKey)

export const createClient = (url?: string, key?: string) => {
  if (url?.includes('placeholder') || (!url && isMock)) return mockSupabase as any
  return createSupabaseClient(url || supabaseUrl, key || supabaseAnonKey)
}

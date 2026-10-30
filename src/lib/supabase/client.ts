import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl, getSupabaseAnonKey } from './env'

export function createClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Supabase Client] Variables de entorno ausentes. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel o .env.local.'
      )
    }
  }

  return createBrowserClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  )
}

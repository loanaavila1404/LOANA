import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey } from './env'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase Server] Variables de entorno ausentes. Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.'
    )
  }

  return createServerClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  )
}

/**
 * Cliente de acceso a base de datos para Server Components autenticados.
 * Utiliza credenciales de service role en servidor para evitar bloqueos
 * de RLS indebidos en lecturas institucionales (catálogos, matrículas y cuotas en modo consulta),
 * siempre tras haber validado la identidad y permisos con requirePermission().
 */
export async function getSafeDbClient() {
  const serviceKey = getSupabaseServiceRoleKey()
  const supabaseUrl = getSupabaseUrl()

  if (serviceKey && supabaseUrl) {
    return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return await createClient()
}


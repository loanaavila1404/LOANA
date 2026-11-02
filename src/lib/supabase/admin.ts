import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from './env'

/**
 * Cliente de administración de Supabase con Service Role (permisos elevados).
 * Exclusivo para uso del lado del servidor (Server Actions / Route Handlers).
 * NUNCA importar ni utilizar en componentes del cliente.
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan las variables de entorno de Supabase Service Role (SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY).'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

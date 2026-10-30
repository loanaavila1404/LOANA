import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from './env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  // Verificación defensiva: Si las variables de entorno aún no están disponibles o
  // están vacías durante el despliegue/invocación de Edge en Vercel, evitamos que
  // createServerClient arroje una excepción no controlada que cause el error 500.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[middleware] Variables de entorno de Supabase ausentes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Continuando sin actualizar sesión.'
      )
    }
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // getUser() refresca automáticamente la sesión del usuario si el token expiró.
    // Envolvemos en try/catch para que fallos de red o tokens inválidos no tiren el middleware.
    await supabase.auth.getUser()
  } catch (error) {
    console.error('[middleware] Error al verificar o refrescar la sesión en Supabase:', error)
  }

  return supabaseResponse
}

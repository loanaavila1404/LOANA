import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAbsoluteUrl } from '@/lib/utils/url'

async function handleGoogleLogin(request: Request) {
  try {
    const supabase = await createClient()
    const callbackUrl = getAbsoluteUrl('/auth/callback', request)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
        scopes: 'email profile openid',
      },
    })

    if (error) {
      console.error('[Google OAuth] Error en signInWithOAuth:', error.message)
      return NextResponse.redirect(getAbsoluteUrl('/login?error=OauthFailed', request), 303)
    }

    if (data?.url) {
      // IMPORTANTE: Se utiliza status 303 (See Other) para forzar al navegador
      // a realizar una petición HTTP GET hacia el endpoint auth/v1/authorize de Supabase.
      // Un redirect 307 predeterminado desde un formulario POST preservaría el método POST
      // y causaría el error "HTTP 405 Method Not Allowed" en Supabase.
      return NextResponse.redirect(data.url, 303)
    }

    return NextResponse.redirect(getAbsoluteUrl('/login', request), 303)
  } catch (err: unknown) {
    console.error('[Google OAuth] Excepción no controlada:', err)
    return NextResponse.redirect(getAbsoluteUrl('/login?error=OauthFailed', request), 303)
  }
}

export async function POST(request: Request) {
  return handleGoogleLogin(request)
}

export async function GET(request: Request) {
  return handleGoogleLogin(request)
}

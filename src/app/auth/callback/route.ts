import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAbsoluteUrl } from '@/lib/utils/url'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(getAbsoluteUrl('/dashboard', request))
    }
  }

  // Redirigir al login informando el fallo de callback
  return NextResponse.redirect(getAbsoluteUrl('/login?error=AuthCallbackFailed', request))
}

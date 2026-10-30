import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAbsoluteUrl } from '@/lib/utils/url'

export async function POST(request: Request) {
  const supabase = await createClient()
  const callbackUrl = getAbsoluteUrl('/auth/callback', request)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    console.error('Error in Google OAuth:', error.message)
    return NextResponse.redirect(getAbsoluteUrl('/login?error=OauthFailed', request))
  }

  if (data?.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect(getAbsoluteUrl('/login', request))
}

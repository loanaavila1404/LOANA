import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { origin } = new URL(request.url)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error in Google OAuth:', error.message)
    return redirect('/login?error=OauthFailed')
  }

  if (data.url) {
    redirect(data.url)
  }

  return redirect('/login')
}

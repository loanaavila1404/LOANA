import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const password = url.searchParams.get('password')

  if (email && password) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      redirect('/dashboard')
    }
  }

  return new Response('Missing credentials', { status: 400 })
}

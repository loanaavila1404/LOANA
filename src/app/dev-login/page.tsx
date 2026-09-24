import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DevLoginPage({ searchParams }: { searchParams: Promise<{ email?: string, password?: string }> }) {
  const params = await searchParams
  const email = params.email
  const password = params.password

  if (email && password) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      redirect('/dashboard')
    } else {
      return <div>Error: {error.message}</div>
    }
  }

  return <div>Dev Login Page</div>
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const user = {
    name: session.user.user_metadata?.full_name || session.user.email || 'Usuario',
    email: session.user.email || '',
    role: session.user.user_metadata?.role || 'Superadministración',
    photoUrl: session.user.user_metadata?.avatar_url || '',
  }

  return (
    <AppLayout user={user}>
      {children}
    </AppLayout>
  )
}

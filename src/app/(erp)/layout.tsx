import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import packageJson from '../../../package.json'
import { cookies } from 'next/headers'

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

  // Fetch real profile, role and permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      roles (
        code,
        name
      )
    `)
    .eq('id', session.user.id)
    .single()

  let permissions: string[] = []
  if (profile?.role_id) {
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select(`
        permissions (
          code
        )
      `)
      .eq('role_id', profile.role_id)
    
    if (rolePerms) {
      permissions = rolePerms.map((rp: any) => rp.permissions?.code).filter(Boolean)
    }
  }

  // Get selected Sede from cookies
  const cookieStore = await cookies()
  const selectedSede = cookieStore.get('erp_sede')?.value || 'tumbes'

  const userRoleCode = profile?.roles?.code || session.user.user_metadata?.role || 'INVITADO'
  const userRoleName = profile?.roles?.name || userRoleCode

  const user = {
    name: profile?.display_name || session.user.user_metadata?.full_name || session.user.email || 'Usuario',
    email: profile?.email || session.user.email || '',
    roleCode: userRoleCode,
    role: userRoleName,
    photoUrl: profile?.photo_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
    permissions: permissions,
    selectedSede: selectedSede
  }

  return (
    <AppLayout user={user} appVersion={packageJson.version}>
      {children}
    </AppLayout>
  )
}

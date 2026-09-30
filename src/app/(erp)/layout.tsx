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
  
  // Validar identidad de forma segura
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
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
    .eq('id', user.id)
    .single()

  // Denegar acceso si no hay perfil o no est activo
  if (!profile || profile.status !== 'ACTIVO') {
    redirect('/login?error=inactive')
  }

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
      permissions = rolePerms.map((rp: { permissions: { code: string } | null }) => rp.permissions?.code).filter(Boolean) as string[]
    }
  }

  // Get selected Sede from cookies safely and securely evaluate it
  const cookieStore = await cookies()
  const cookieSede = cookieStore.get('erp_sede')?.value

  // Use the new service
  const { getSedeContext } = await import('@/lib/services/sede-context');
  const sedeContext = await getSedeContext(user.id, permissions, cookieSede);

  const userRoleCode = profile?.roles?.code || 'INVITADO'
  const userRoleName = profile?.roles?.name || userRoleCode

  const sessionUser = {
    name: profile?.display_name || user.user_metadata?.full_name || user.email || 'Usuario',
    email: profile?.email || user.email || '',
    roleCode: userRoleCode,
    role: userRoleName,
    photoUrl: profile?.photo_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    permissions: permissions
  }

  return (
    <AppLayout user={sessionUser} appVersion={packageJson.version} sedeContext={sedeContext}>
      {children}
    </AppLayout>
  )
}

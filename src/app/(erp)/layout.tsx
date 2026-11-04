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

  // Obtener contexto de autorización RBAC unificado
  const { getUserAuthContext } = await import('@/lib/auth/permissions');
  const authCtx = await getUserAuthContext();

  if (!authCtx) {
    redirect('/login?error=inactive');
  }

  // Fetch real profile for display info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const permissions = authCtx.permissions;

  // Get selected Sede from cookies safely and securely evaluate it
  const cookieStore = await cookies();
  const cookieSede = cookieStore.get('erp_sede')?.value;

  // Use the sede service
  const { getSedeContext } = await import('@/lib/services/sede-context');
  const sedeContext = await getSedeContext(user.id, permissions, cookieSede);

  const sessionUser = {
    name: profile?.display_name || user.user_metadata?.full_name || user.email || 'Usuario',
    email: profile?.email || user.email || '',
    roleCode: authCtx.roleCode,
    role: authCtx.roleName,
    photoUrl: profile?.photo_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    permissions: permissions
  };

  return (
    <AppLayout user={sessionUser} appVersion={packageJson.version} sedeContext={sedeContext}>
      {children}
    </AppLayout>
  )
}

import { createClient } from '@/lib/supabase/server';
import { UsuariosManagerClient } from "@/components/features/usuarios/UsuariosManagerClient";

export default async function UsuariosPage() {
  const supabase = await createClient();

  // Consultar usuarios y roles asociados en Supabase
  const { data: perfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      display_name,
      photo_url,
      status,
      last_access_at,
      roles (
        id,
        name,
        code
      )
    `)
    .order('display_name');

  // Obtener usuario autenticado actual desde la sesión
  const { data: { user } } = await supabase.auth.getUser();

  let listadoPerfiles = perfiles || [];

  // Si la consulta de perfiles viene vacía pero existe la sesión autenticada,
  // asegurar el registro real de la Superadministradora actual
  if (listadoPerfiles.length === 0 && user) {
    listadoPerfiles = [
      {
        id: user.id,
        email: user.email || 'loanaavila.la@gmail.com',
        display_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || 'Loana Avila Neyra',
        photo_url: (user.user_metadata?.avatar_url as string) || null,
        status: 'ACTIVO',
        last_access_at: user.last_sign_in_at || new Date().toISOString(),
        roles: {
          id: '6132f403-342b-496d-9ce0-781c4f40854f',
          name: 'Super Administrador',
          code: 'SUPERADMIN'
        }
      }
    ];
  }

  return (
    <UsuariosManagerClient 
      initialProfiles={listadoPerfiles} 
      currentUserEmail={user?.email || 'loanaavila.la@gmail.com'}
    />
  );
}

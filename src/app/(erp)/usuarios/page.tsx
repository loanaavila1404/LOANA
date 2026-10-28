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
      status,
      last_access_at,
      roles (
        name,
        code
      )
    `)
    .order('display_name');

  return (
    <UsuariosManagerClient initialProfiles={perfiles || []} />
  );
}

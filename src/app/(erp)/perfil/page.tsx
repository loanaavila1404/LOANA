import { createClient } from "@/lib/supabase/server";
import { PerfilManagerClient, PerfilUsuarioData } from "@/components/features/perfil/PerfilManagerClient";

export default async function PerfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
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
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  // Extraer nombres y apellidos desde el display_name o metadatos de usuario
  const displayName = 
    profile?.display_name || 
    (user?.user_metadata?.full_name as string) || 
    (user?.user_metadata?.name as string) || 
    "Loana Avila Neyra";

  const nameParts = displayName.trim().split(/\s+/);
  const defaultNombres = (user?.user_metadata?.nombres as string) || nameParts[0] || "Loana";
  const defaultApellidos = (user?.user_metadata?.apellidos as string) || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Avila Neyra");

  const initialData: PerfilUsuarioData = {
    id: user?.id || "aebd92ba-4c31-4b9a-a5d0-af229307dde1",
    email: profile?.email || user?.email || "loanaavila.la@gmail.com",
    displayName,
    nombres: defaultNombres,
    apellidos: defaultApellidos,
    dni: (user?.user_metadata?.dni as string) || "72849102",
    telefono: (user?.user_metadata?.telefono as string) || "+51 972 849 102",
    correoRecuperacion: (user?.user_metadata?.correo_recuperacion as string) || user?.email || "loanaavila.la@gmail.com",
    sede: "Sede Central - Tumbes",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rolNombre: profile?.roles?.name || "Super Administrador",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rolCodigo: profile?.roles?.code || "SUPERADMIN",
    photoUrl: profile?.photo_url || (user?.user_metadata?.avatar_url as string) || (user?.user_metadata?.picture as string) || null,
    lastSignIn: user?.last_sign_in_at || null,
    provider: (user?.app_metadata?.provider as string) || "Google Workspace",
    isProtected: true,
  };

  return <PerfilManagerClient initialData={initialData} />;
}

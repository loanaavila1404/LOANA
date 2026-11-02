import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginSplitScreen } from "@/components/features/auth/LoginSplitScreen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const error = resolvedParams?.error || null;

  // IMPORTANTE: Si la URL incluye un parámetro de error (ej. ?error=inactive o ?error=OauthFailed),
  // NO debemos redirigir al dashboard aunque exista una sesión en cookies. Esto evita un bucle
  // infinito de redirecciones (ERR_TOO_MANY_REDIRECTS) entre ErpLayout y LoginPage.
  if (!error) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      redirect("/dashboard");
    }
  }

  return <LoginSplitScreen initialError={error} />;
}

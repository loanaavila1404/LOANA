import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginSplitScreen } from "@/components/features/auth/LoginSplitScreen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const error = resolvedParams?.error || null;

  return <LoginSplitScreen initialError={error} />;
}

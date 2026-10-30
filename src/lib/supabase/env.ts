/**
 * Utilidad segura para resolver las variables de entorno de Supabase.
 * Soporta las distintas convenciones de Vercel y Supabase:
 *
 * 1. URL:
 *    - NEXT_PUBLIC_SUPABASE_URL (Estándar oficial en Vercel y Supabase)
 *    - SUPABASE_URL (Alternativa común de entorno)
 *
 * 2. Llave pública / anónima:
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY (Estándar oficial en Vercel y plantillas de Supabase)
 *    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Nueva convención de Supabase)
 *    - SUPABASE_ANON_KEY (Alternativa común en servidor)
 *    - SUPABASE_PUBLISHABLE_KEY
 */

export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  return url.trim();
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';
  return key.trim();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

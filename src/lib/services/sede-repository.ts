import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DatabaseWithSedes } from '@/types/sedes.pending.types';
import { Sede } from '@/lib/types';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

async function createSedesClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createServerClient<DatabaseWithSedes>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component context
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Server Component context
          }
        },
      },
    }
  );
}

export async function fetchSedesActivas(): Promise<Sede[]> {
  const supabase = await createSedesClient();
  const { data, error } = await supabase
    .from('sedes')
    .select('id, codigo, nombre, status')
    .eq('status', 'ACTIVO')
    .order('codigo', { ascending: true });

  if (error) {
    throw new Error('Error al consultar sedes: ' + error.message);
  }

  // Type safe without cast because DatabaseWithSedes perfectly matches Sede mapping
  return data;
}

export async function fetchUsuarioSedes(userId: string): Promise<string[]> {
  const supabase = await createSedesClient();
  const { data, error } = await supabase
    .from('usuario_sedes')
    .select('sede_id')
    .eq('usuario_id', userId);

  if (error) {
    throw new Error('Error al consultar usuario_sedes: ' + error.message);
  }

  return data.map(us => us.sede_id);
}

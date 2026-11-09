'use server';

import { revalidatePath } from 'next/cache';
import { getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';

const CONFIG_KEY = 'malla_prerrequisitos';

export async function getPrerrequisitosMallaAction(): Promise<Record<string, string>> {
  try {
    const db = await getSafeDbClient();
    const { data } = await db
      .from('institutional_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .maybeSingle();

    if (!data?.value) return {};
    return JSON.parse(data.value);
  } catch (err) {
    console.warn('[getPrerrequisitosMallaAction] Error reading config:', err);
    return {};
  }
}

export async function savePrerrequisitoAction(
  cursoId: string,
  prerrequisitoCodigo: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const permissions = await getUserPermissions();
    if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
      return { success: false, error: 'No tienes permiso para configurar prerrequisitos de la malla' };
    }

    const db = await getSafeDbClient();
    const authCtx = await getUserAuthContext();

    // 1. Obtener configuración actual
    const currentMap = await getPrerrequisitosMallaAction();

    // 2. Actualizar clave
    if (prerrequisitoCodigo) {
      currentMap[cursoId] = prerrequisitoCodigo;
    } else {
      delete currentMap[cursoId];
    }

    const jsonValue = JSON.stringify(currentMap);

    // 3. Upsert en institutional_config
    const { error: upsertErr } = await db
      .from('institutional_config')
      .upsert(
        {
          key: CONFIG_KEY,
          value: jsonValue,
          description: 'Mapa de prerrequisitos de la malla curricular académica (carreras técnicas 6 ciclos)',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (upsertErr) {
      return { success: false, error: upsertErr.message };
    }

    // 4. Registro en auditoría WORM
    try {
      await db.from('audit_logs').insert({
        user_id: authCtx?.userId || null,
        user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
        action: 'UPDATE',
        module: 'ACADEMICO',
        entity: 'malla_prerrequisitos',
        entity_id: cursoId,
        detail: `Actualización de prerrequisito para la asignatura ID ${cursoId}: ${prerrequisitoCodigo || 'Ninguno'}`,
        data_after: { cursoId, prerrequisitoCodigo },
        result: 'EXITO',
      });
    } catch (auditErr) {
      console.warn('[savePrerrequisitoAction] Error audit:', auditErr);
    }

    revalidatePath('/oferta/programas');
    revalidatePath('/oferta/programas/[id]', 'page');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return { success: false, error: msg };
  }
}

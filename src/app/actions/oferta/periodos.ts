'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { periodoSchema } from '@/lib/validators/oferta';

export async function createPeriodoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear periodos' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = periodoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('periodos').select('id').eq('codigo', parsed.data.codigo).single();
  if (existing) return { error: 'Ya existe un periodo con este código' };

  const { data, error } = await supabase.from('periodos').insert(parsed.data).select().single();
  if (error) return { error: 'Ocurrió un error al crear el periodo' };

  revalidatePath('/oferta/periodos');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updatePeriodoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar periodos' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = periodoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('periodos').select('id').eq('codigo', parsed.data.codigo).neq('id', id).maybeSingle();
  if (existing) return { error: 'Ya existe otro periodo con este código' };

  const { data, error } = await supabase.from('periodos').update(parsed.data).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar el periodo' };

  revalidatePath('/oferta/periodos');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function togglePeriodoStatusAction(id: string, currentStatus: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para modificar periodos' };
  }

  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const supabase = await createClient();

  const { data, error } = await supabase.from('periodos').update({ status: newStatus }).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar el estado' };

  revalidatePath('/oferta/periodos');
  return { success: true, data };
}

export async function deletePeriodoAction(id: string, motivo?: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para eliminar periodos académicos' };
  }

  const db = await getSafeDbClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Obtener datos del periodo antes de borrar
  const { data: periodo, error: fetchErr } = await db
    .from('periodos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !periodo) {
    return { error: 'El periodo académico no existe o ya fue eliminado.' };
  }

  // 2. Registrar en auditoría institucional
  const now = new Date();
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'periodos',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: user?.id || null,
      user_role: 'ADMIN',
      detail: `Eliminación física definitiva del periodo académico ${periodo.codigo} (${periodo.nombre}). Motivo: ${motivo || 'Limpieza institucional'}.`,
      data_before: {
        ...periodo,
        fecha_eliminacion: now.toISOString(),
        eliminado_por: user?.email || 'Administrador',
      },
      data_after: {
        status: 'ELIMINADO_FISICO',
        deleted_at: now.toISOString(),
        hard_delete: true,
      },
      result: 'EXITO',
    });
  } catch (auditErr) {
    console.error('Error al auditar borrado de periodo:', auditErr);
  }

  // 3. Desvincular ediciones que apunten a este periodo
  await db.from('ediciones').update({ periodo_id: null }).eq('periodo_id', id);

  // 4. Borrado físico definitivo
  const { error: delErr } = await db.from('periodos').delete().eq('id', id);
  if (delErr) {
    return { error: `Error al eliminar el periodo académico: ${delErr.message}` };
  }

  revalidatePath('/oferta/periodos');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/programas');
  return { success: true };
}

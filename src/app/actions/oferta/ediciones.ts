'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';
import { edicionSchema } from '@/lib/validators/oferta';

async function generateNextEdicionCodigo(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: rows } = await supabase
    .from('ediciones')
    .select('codigo');

  let maxNum = 0;
  for (const r of rows || []) {
    const match = (r.codigo || '').toUpperCase().match(/ED-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  let candidateNum = Math.max(maxNum + 1, (rows?.length || 0) + 1);
  const existingSet = new Set((rows || []).map(r => (r.codigo || '').toUpperCase()));

  while (existingSet.has(`ED-${String(candidateNum).padStart(3, '0')}`)) {
    candidateNum++;
  }

  return `ED-${String(candidateNum).padStart(3, '0')}`;
}

export async function getNextEdicionCodigoAction(): Promise<string> {
  const supabase = await createClient();
  return generateNextEdicionCodigo(supabase);
}

export async function createEdicionAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear ediciones' };
  }

  const supabase = await createClient();
  const rawCodigo = String(formData.get('codigo') || '').trim().toUpperCase();
  const finalCodigo = rawCodigo || (await generateNextEdicionCodigo(supabase));

  const payload = {
    programa_id: formData.get('programa_id'),
    plan_id: formData.get('plan_id'),
    periodo_id: formData.get('periodo_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: finalCodigo,
    nombre: formData.get('nombre') || null,
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    turno: formData.get('turno') || null,
    modalidad: formData.get('modalidad') || null,
    vacantes: formData.get('vacantes') || null,
    precio_matricula: formData.get('precio_matricula') !== '' ? formData.get('precio_matricula') : null,
    precio_pension: formData.get('precio_pension') !== '' ? formData.get('precio_pension') : null,
    numero_pensiones: formData.get('numero_pensiones') !== '' ? formData.get('numero_pensiones') : null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).maybeSingle();
  if (existing) return { error: 'Ya existe una edición con este código' };

  const { data, error } = await supabase.from('ediciones').insert(parsed.data).select().single();
  if (error) return { error: 'Ocurrió un error al crear la edición' };

  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updateEdicionAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar ediciones' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    plan_id: formData.get('plan_id'),
    periodo_id: formData.get('periodo_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre') || null,
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    turno: formData.get('turno') || null,
    modalidad: formData.get('modalidad') || null,
    vacantes: formData.get('vacantes') || null,
    precio_matricula: formData.get('precio_matricula') !== '' ? formData.get('precio_matricula') : null,
    precio_pension: formData.get('precio_pension') !== '' ? formData.get('precio_pension') : null,
    numero_pensiones: formData.get('numero_pensiones') !== '' ? formData.get('numero_pensiones') : null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).neq('id', id).maybeSingle();
  if (existing) return { error: 'Ya existe otra edición con este código' };

  const { data, error } = await supabase.from('ediciones').update(parsed.data).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar la edición' };

  revalidatePath('/oferta/ediciones');
  revalidatePath(`/oferta/ediciones/${id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function toggleEdicionStatusAction(
  id: string,
  currentStatus: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para modificar ediciones' };
  }

  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const db = await getSafeDbClient();

  const { error } = await db
    .from('ediciones')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    return { error: 'Error al cambiar estado de la edición: ' + error.message };
  }

  revalidatePath('/oferta/ediciones');
  revalidatePath(`/oferta/ediciones/${id}`);
  return { success: true };
}

export async function deleteEdicionAction(
  id: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar ediciones' };
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  // 1. Obtener datos antes del borrado
  const { data: edicion, error: fetchErr } = await db
    .from('ediciones')
    .select('*, programas(codigo, nombre)')
    .eq('id', id)
    .single();

  if (fetchErr || !edicion) {
    return { error: 'No se encontró la edición a eliminar' };
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva de edición autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 2. Desvincular prospectos que apunten a esta edición
  await db.from('prospectos').update({ edicion_id: null }).eq('edicion_id', id);

  // 3. Eliminar bloques horarios vinculados a la edición
  await db.from('horarios').delete().eq('edicion_id', id);

  // 4. Limpiar matrículas asociadas
  const { data: mats } = await db
    .from('matriculas')
    .select('id')
    .eq('edicion_id', id);

  const matIds = (mats || []).map((m: { id: string }) => m.id);
  if (matIds.length > 0) {
    const { data: cuotas } = await db
      .from('cuotas')
      .select('id')
      .in('matricula_id', matIds);

    const cuotaIds = (cuotas || []).map((c: { id: string }) => c.id);
    if (cuotaIds.length > 0) {
      await db.from('pago_aplicaciones').delete().in('cuota_id', cuotaIds);
      await db.from('cuotas').delete().in('matricula_id', matIds);
    }
    await db.from('prospectos').update({ matricula_id: null }).in('matricula_id', matIds);
    await db.from('matriculas').delete().eq('edicion_id', id);
  }

  // 5. Borrado físico definitivo (Hard Delete) de la tabla ediciones
  const { error: delErr } = await db
    .from('ediciones')
    .delete()
    .eq('id', id);

  if (delErr) {
    return { error: `Error al eliminar físicamente la edición: ${delErr.message}` };
  }

  // 6. Registro permanente en bitácora audit_logs
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'ediciones',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de edición: ${edicion.codigo} - ${edicion.nombre || ''} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        edicion,
        matriculas_eliminadas: matIds.length,
        fecha_eliminacion: now.toISOString(),
        eliminado_por: authCtx?.userId || 'Administrador',
        motivo: motivoTexto,
      },
      data_after: {
        status: 'ELIMINADO_FISICO',
        deleted_at: now.toISOString(),
        hard_delete: true,
      },
      result: 'EXITO',
    });
  } catch (auditErr) {
    console.error('Error al registrar auditoría de borrado de edición:', auditErr);
  }

  revalidatePath('/oferta/ediciones');
  revalidatePath(`/oferta/ediciones/${id}`);
  revalidatePath('/oferta/programas');
  revalidatePath('/horarios');
  revalidatePath('/auditoria');
  return { success: true };
}

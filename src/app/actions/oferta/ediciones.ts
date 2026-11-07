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

  // 2. Verificar matrículas asociadas
  const { count: matriculasCount } = await db
    .from('matriculas')
    .select('id', { count: 'exact', head: true })
    .eq('edicion_id', id);

  if (matriculasCount && matriculasCount > 0) {
    return {
      error: `No se puede eliminar la edición porque cuenta con ${matriculasCount} matrícula(s) asociadas. Inactívela para conservar el historial de los alumnos matriculados.`,
    };
  }

  const motivoTexto = motivo || 'Eliminación de grupo/edición solicitada por administración';

  // 3. Borrado lógico asegurado en la tabla de ediciones
  await db
    .from('ediciones')
    .update({ status: 'ELIMINADO' })
    .eq('id', id);

  let physicalDelete = false;
  try {
    // Si tiene sesiones horarias vinculadas, eliminarlas primero
    await db.from('horarios').delete().eq('edicion_id', id);
    const { error: delErr } = await db.from('ediciones').delete().eq('id', id);
    if (!delErr) physicalDelete = true;
  } catch {
    // El soft-delete asegura su exclusión
  }

  // 4. Registro permanente en bitácora audit_logs
  try {
    await db.from('audit_logs').insert({
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'ADMINISTRACION',
      action: 'DELETE',
      module: 'OFERTA_ACADEMICA',
      entity: 'ediciones',
      entity_id: id,
      detail: `Eliminación de edición/grupo: ${edicion.codigo} - ${edicion.nombre || ''} (${physicalDelete ? 'Físico' : 'Lógico'}). Motivo: ${motivoTexto}`,
      data_before: edicion,
      data_after: { status: 'ELIMINADO', physicalDelete, motivo: motivoTexto },
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

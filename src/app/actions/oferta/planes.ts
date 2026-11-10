'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';
import { planEstudioSchema, cicloSchema, cursoSchema } from '@/lib/validators/oferta';

async function generateNextCursoCodigo(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: rows } = await supabase.from('cursos').select('codigo');

  let maxNum = 0;
  const existing = new Set<string>();
  for (const r of rows || []) {
    const cod = (r.codigo || '').toUpperCase().trim();
    if (cod) existing.add(cod);
    const match = cod.match(/^CRS-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  let next = maxNum + 1;
  while (existing.has(`CRS-${String(next).padStart(3, '0')}`)) next++;
  return `CRS-${String(next).padStart(3, '0')}`;
}

export async function getNextCursoCodigoAction(): Promise<string> {
  const supabase = await createClient();
  return generateNextCursoCodigo(supabase);
}

// --- PLANES DE ESTUDIO ---
export async function createPlanAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear planes de estudio' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    version: formData.get('version') || null,
    fecha_vigencia_desde: formData.get('fecha_vigencia_desde') || null,
    fecha_vigencia_hasta: formData.get('fecha_vigencia_hasta') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = planEstudioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .maybeSingle();
  if (existing) return { error: 'Ya existe un plan con este código' };

  const { data, error } = await supabase
    .from('planes_estudio')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { error: `Error al crear el plan de estudio: ${error.message}` };

  revalidatePath(`/oferta/programas/${parsed.data.programa_id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updatePlanAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar planes de estudio' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    version: formData.get('version') || null,
    fecha_vigencia_desde: formData.get('fecha_vigencia_desde') || null,
    fecha_vigencia_hasta: formData.get('fecha_vigencia_hasta') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = planEstudioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .neq('id', id)
    .maybeSingle();
  if (existing) return { error: 'Ya existe otro plan con este código' };

  const { data, error } = await supabase
    .from('planes_estudio')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();
  if (error) return { error: `Error al actualizar el plan: ${error.message}` };

  revalidatePath(`/oferta/programas/${parsed.data.programa_id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

// --- CICLOS ---
export async function createCicloAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear ciclos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    numero_orden: formData.get('numero_orden'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cicloSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ciclos')
    .select('id')
    .eq('plan_id', parsed.data.plan_id)
    .eq('numero_orden', parsed.data.numero_orden)
    .maybeSingle();
  if (existing) return { error: 'Ya existe un ciclo con este número de orden en el plan' };

  const { data, error } = await supabase
    .from('ciclos')
    .insert({
      plan_id: parsed.data.plan_id,
      numero_orden: parsed.data.numero_orden,
      nombre: parsed.data.nombre || `Ciclo ${parsed.data.numero_orden}`,
      status: parsed.data.status,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) return { error: `Error al crear el ciclo: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

export async function updateCicloAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar ciclos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    numero_orden: formData.get('numero_orden'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cicloSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ciclos')
    .select('id')
    .eq('plan_id', parsed.data.plan_id)
    .eq('numero_orden', parsed.data.numero_orden)
    .neq('id', id)
    .maybeSingle();
  if (existing) return { error: 'Ya existe otro ciclo con este número de orden en el plan' };

  const { data, error } = await supabase
    .from('ciclos')
    .update({
      plan_id: parsed.data.plan_id,
      numero_orden: parsed.data.numero_orden,
      nombre: parsed.data.nombre || `Ciclo ${parsed.data.numero_orden}`,
      status: parsed.data.status,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: `Error al actualizar el ciclo: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

// --- CURSOS ---
export async function createCursoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear cursos' };
  }

  const supabase = await createClient();

  const rawCodigo = String(formData.get('codigo') || '').trim().toUpperCase();
  const finalCodigo = rawCodigo || (await generateNextCursoCodigo(supabase));

  const payload = {
    plan_id: formData.get('plan_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: finalCodigo,
    nombre: formData.get('nombre'),
    horas_semanales: formData.get('horas_semanales') || null,
    creditos: formData.get('creditos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cursoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: duplicado } = await supabase
    .from('cursos')
    .select('id')
    .eq('codigo', finalCodigo)
    .maybeSingle();
  if (duplicado) return { error: `Ya existe un curso con el código ${finalCodigo}` };

  const { data, error } = await supabase
    .from('cursos')
    .insert({
      ...parsed.data,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) return { error: `Error al crear el curso: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/ediciones/[id]', 'page');

  return { success: true, data };
}

export async function updateCursoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar cursos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre'),
    horas_semanales: formData.get('horas_semanales') || null,
    creditos: formData.get('creditos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cursoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cursos')
    .update({
      ...parsed.data,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: `Error al actualizar el curso: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

export async function deleteCursoAction(
  id: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar asignaturas' };
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  // 1. Obtener datos antes del borrado
  const { data: curso, error: fetchErr } = await db
    .from('cursos')
    .select('*, planes_estudio(programa_id)')
    .eq('id', id)
    .single();

  if (fetchErr || !curso) {
    return { error: 'No se encontró el curso a eliminar' };
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva de asignatura autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 2. Eliminar posibles bloques de horarios asociados al curso
  await db.from('horarios').delete().eq('curso_id', id);

  // 3. Borrado físico definitivo (Hard Delete) de la tabla cursos
  const { error: delErr } = await db.from('cursos').delete().eq('id', id);
  if (delErr) {
    return { error: `Error al eliminar físicamente la asignatura: ${delErr.message}` };
  }

  // 4. Registro en bitácora audit_logs
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'cursos',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de asignatura: ${curso.codigo} - ${curso.nombre} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        curso,
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
    console.error('Error al registrar auditoría de borrado de curso:', auditErr);
  }

  const plan = Array.isArray(curso.planes_estudio) ? curso.planes_estudio[0] : curso.planes_estudio;
  if (plan?.programa_id) {
    revalidatePath(`/oferta/programas/${plan.programa_id}`);
  }
  revalidatePath('/oferta/programas');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/horarios');
  revalidatePath('/auditoria');
  return { success: true };
}

export async function deleteCicloAction(
  id: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar ciclos' };
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  const { data: ciclo, error: fetchErr } = await db
    .from('ciclos')
    .select('*, planes_estudio(programa_id)')
    .eq('id', id)
    .single();

  if (fetchErr || !ciclo) {
    return { error: 'No se encontró el ciclo a eliminar' };
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva de ciclo autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 1. Obtener y eliminar cursos asociados a este ciclo
  const { data: cursos } = await db.from('cursos').select('id').eq('ciclo_id', id);
  const cursoIds = (cursos || []).map(c => c.id);
  if (cursoIds.length > 0) {
    await db.from('horarios').delete().in('curso_id', cursoIds);
    await db.from('cursos').delete().eq('ciclo_id', id);
  }

  // 2. Borrado físico del ciclo
  const { error: delErr } = await db.from('ciclos').delete().eq('id', id);
  if (delErr) {
    return { error: `Error al eliminar físicamente el ciclo: ${delErr.message}` };
  }

  // 3. Auditoría
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'ciclos',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de ciclo: ${ciclo.nombre || `Ciclo ${ciclo.numero_orden}`} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        ciclo,
        cursos_eliminados: cursoIds.length,
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
    console.error('Error al registrar auditoría de borrado de ciclo:', auditErr);
  }

  const plan = Array.isArray(ciclo.planes_estudio) ? ciclo.planes_estudio[0] : ciclo.planes_estudio;
  if (plan?.programa_id) {
    revalidatePath(`/oferta/programas/${plan.programa_id}`);
  }
  revalidatePath('/oferta/programas');
  revalidatePath('/auditoria');
  return { success: true };
}

export async function deletePlanAction(
  id: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar planes de estudio' };
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  const { data: plan, error: fetchErr } = await db
    .from('planes_estudio')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !plan) {
    return { error: 'No se encontró el plan de estudio a eliminar' };
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva de plan de estudio autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 1. Obtener y eliminar cursos del plan
  const { data: cursos } = await db.from('cursos').select('id').eq('plan_id', id);
  const cursoIds = (cursos || []).map(c => c.id);
  if (cursoIds.length > 0) {
    await db.from('horarios').delete().in('curso_id', cursoIds);
    await db.from('cursos').delete().eq('plan_id', id);
  }

  // 2. Eliminar ciclos del plan
  await db.from('ciclos').delete().eq('plan_id', id);

  // 3. Borrado físico del plan
  const { error: delErr } = await db.from('planes_estudio').delete().eq('id', id);
  if (delErr) {
    return { error: `Error al eliminar físicamente el plan: ${delErr.message}` };
  }

  // 4. Auditoría
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'planes_estudio',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de plan de estudio: ${plan.codigo} - ${plan.nombre} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        plan,
        cursos_eliminados: cursoIds.length,
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
    console.error('Error al registrar auditoría de borrado de plan:', auditErr);
  }

  if (plan.programa_id) {
    revalidatePath(`/oferta/programas/${plan.programa_id}`);
  }
  revalidatePath('/oferta/programas');
  revalidatePath('/auditoria');
  return { success: true };
}


'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';
import { programaSchema } from '@/lib/validators/oferta';
import { Database } from '@/types/database.types';

type ProgramaRow = Database['public']['Tables']['programas']['Row'];

export type ProgramaActionState = {
  error?: string;
  success?: boolean;
  data?: ProgramaRow;
};

async function generateNextProgramaCodigo(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: rows } = await supabase
    .from('programas')
    .select('codigo');

  let maxNum = 0;
  for (const r of rows || []) {
    const match = (r.codigo || '').toUpperCase().match(/PRG-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  let candidateNum = Math.max(maxNum + 1, (rows?.length || 0) + 1);
  const existingSet = new Set((rows || []).map(r => (r.codigo || '').toUpperCase()));

  while (existingSet.has(`PRG-${String(candidateNum).padStart(3, '0')}`)) {
    candidateNum++;
  }

  return `PRG-${String(candidateNum).padStart(3, '0')}`;
}

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

async function syncProgramaPreciosToEdiciones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  programaId: string,
  codigoPrograma: string,
  nombrePrograma: string,
  totalCiclos: number | null | undefined,
  rawPrecioMatricula: FormDataEntryValue | null,
  rawPrecioPension: FormDataEntryValue | null
) {
  const hasMat = rawPrecioMatricula !== null && String(rawPrecioMatricula).trim() !== '';
  const hasPen = rawPrecioPension !== null && String(rawPrecioPension).trim() !== '';
  if (!hasMat && !hasPen) return;

  const precioMatricula = hasMat ? Number(rawPrecioMatricula) : null;
  const precioPension = hasPen ? Number(rawPrecioPension) : null;

  // 1. Verificar si ya existen ediciones para este programa
  const { data: edicionesExistentes } = await supabase
    .from('ediciones')
    .select('id, status')
    .eq('programa_id', programaId)
    .order('created_at', { ascending: false });

  if (edicionesExistentes && edicionesExistentes.length > 0) {
    const updatePayload: { precio_matricula?: number | null; precio_pension?: number | null } = {};
    if (hasMat) updatePayload.precio_matricula = precioMatricula;
    if (hasPen) updatePayload.precio_pension = precioPension;

    await supabase
      .from('ediciones')
      .update(updatePayload)
      .eq('programa_id', programaId);
    return;
  }

  // Si el programa aún no tiene ediciones, no crear automáticamente "Grupo Base"
  // para evitar ediciones duplicadas. Las ediciones se crean explícitamente mediante "+ Nueva Edición".
}

export async function getNextProgramaCodigoAction(): Promise<string> {
  const supabase = await createClient();
  return generateNextProgramaCodigo(supabase);
}

export async function createProgramaAction(
  prevState: ProgramaActionState,
  formData: FormData
): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear programas' };
  }

  const supabase = await createClient();
  const rawCodigo = String(formData.get('codigo') || '').trim().toUpperCase();
  const finalCodigo = rawCodigo || (await generateNextProgramaCodigo(supabase));

  const payload = {
    codigo: finalCodigo,
    nombre: formData.get('nombre'),
    tipo_programa: formData.get('tipo_programa'),
    duracion_cantidad: formData.get('duracion_cantidad') || null,
    duracion_unidad: formData.get('duracion_unidad') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    descripcion: formData.get('descripcion') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = programaSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data: existing } = await supabase
    .from('programas')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .maybeSingle();

  if (existing) {
    return { error: 'Ya existe un programa con este código' };
  }

  const { data, error } = await supabase
    .from('programas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Error insertando programa:', error);
    return { error: 'Ocurrió un error al crear el programa' };
  }

  // Auto-crear estructura básica (Plan Activo + Ciclo I) internamente
  try {
    const anio = new Date().getFullYear();
    const codigoBase = `PLAN-${parsed.data.codigo}-${anio}`;
    const { data: planInsertado, error: planError } = await supabase
      .from('planes_estudio')
      .insert({
        programa_id: data.id,
        codigo: codigoBase,
        nombre: `Plan Curricular ${anio}`,
        version: '1.0',
        total_ciclos: parsed.data.total_ciclos || 1,
        status: 'ACTIVO'
      })
      .select('id')
      .single();

    if (!planError && planInsertado) {
      await supabase.from('ciclos').insert({
        plan_id: planInsertado.id,
        numero_orden: 1,
        nombre: 'Fundamentos y Formación Base',
        status: 'ACTIVO'
      });
    }
  } catch (e) {
    console.error('Error silencioso al crear estructura básica', e);
  }

  // Sincronizar Derecho de Matrícula e Inversión Mensual / Pensión
  await syncProgramaPreciosToEdiciones(
    supabase,
    data.id,
    data.codigo,
    data.nombre,
    data.total_ciclos,
    formData.get('precio_matricula'),
    formData.get('precio_pension')
  );

  revalidatePath('/oferta/programas');
  revalidatePath('/oferta/ediciones');
  return { success: true, data };
}

export async function updateProgramaAction(
  id: string,
  prevState: ProgramaActionState,
  formData: FormData
): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar programas' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    tipo_programa: formData.get('tipo_programa'),
    duracion_cantidad: formData.get('duracion_cantidad') || null,
    duracion_unidad: formData.get('duracion_unidad') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    descripcion: formData.get('descripcion') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = programaSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('programas')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .neq('id', id)
    .maybeSingle();

  if (existing) {
    return { error: 'Ya existe otro programa con este código' };
  }

  const { data, error } = await supabase
    .from('programas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando programa:', error);
    return { error: 'Ocurrió un error al actualizar el programa' };
  }

  // Sincronizar Derecho de Matrícula e Inversión Mensual / Pensión
  await syncProgramaPreciosToEdiciones(
    supabase,
    data.id,
    data.codigo,
    data.nombre,
    data.total_ciclos,
    formData.get('precio_matricula'),
    formData.get('precio_pension')
  );

  revalidatePath('/oferta/programas');
  revalidatePath(`/oferta/programas/${id}`);
  revalidatePath('/oferta/ediciones');
  return { success: true, data };
}

export async function toggleProgramaStatusAction(id: string, currentStatus: string): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para modificar programas' };
  }

  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('programas')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando estado del programa:', error);
    return { error: 'Ocurrió un error al actualizar el estado' };
  }

  revalidatePath('/oferta/programas');
  revalidatePath(`/oferta/programas/${id}`);
  return { success: true, data };
}

export async function createEstructuraBasicaAction(programaId: string): Promise<{error?: string, success?: boolean}> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para configurar la estructura' };
  }

  const supabase = await createClient();
  
  const { data: programa } = await supabase.from('programas').select('*').eq('id', programaId).single();
  if (!programa) return { error: 'Programa no encontrado' };

  let planId;
  const { data: existingPlan } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('programa_id', programaId)
    .eq('status', 'ACTIVO')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPlan) {
    planId = existingPlan.id;
  } else {
    const anio = new Date().getFullYear();
    const codigoBase = `PLAN-${programa.codigo}-${anio}-${Math.floor(Math.random()*1000)}`;
    const { data: planInsertado, error: planError } = await supabase
      .from('planes_estudio')
      .insert({
        programa_id: programaId,
        codigo: codigoBase,
        nombre: `Plan vigente ${anio}`,
        version: '1.0',
        status: 'ACTIVO'
      })
      .select('id')
      .single();
    
    if (planError) {
      console.error('Error creando plan:', planError);
      return { error: 'Ocurrió un error al crear el plan de estudio' };
    }
    planId = planInsertado.id;
  }

  const { count } = await supabase
    .from('ciclos')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId);
    
  if (count === 0) {
    await supabase.from('ciclos').insert({
      plan_id: planId,
      numero_orden: 1,
      nombre: 'Ciclo I - Formación Base',
      status: 'ACTIVO'
    });
  }

  revalidatePath(`/oferta/programas/${programaId}`);
  return { success: true };
}

export async function deleteProgramaAction(
  id: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PROGRAMAS.EDITAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar programas' };
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  // 1. Obtener datos y snapshot completo antes del borrado
  const { data: programa, error: fetchErr } = await db
    .from('programas')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !programa) {
    return { error: 'No se encontró el programa a eliminar' };
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva de programa autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 2. Obtener planes asociados al programa
  const { data: planes } = await db
    .from('planes_estudio')
    .select('id, codigo, nombre')
    .eq('programa_id', id);
  const planIds = (planes || []).map((p: { id: string }) => p.id);

  // 3. Obtener ciclos asociados a esos planes
  let cicloIds: string[] = [];
  if (planIds.length > 0) {
    const { data: ciclos } = await db
      .from('ciclos')
      .select('id')
      .in('plan_id', planIds);
    cicloIds = (ciclos || []).map((c: { id: string }) => c.id);
  }

  // 4. Obtener cursos asociados (tanto por plan_id como por ciclo_id)
  let cursoIds: string[] = [];
  const cursoQueries = [];
  if (planIds.length > 0) {
    cursoQueries.push(db.from('cursos').select('id').in('plan_id', planIds));
  }
  if (cicloIds.length > 0) {
    cursoQueries.push(db.from('cursos').select('id').in('ciclo_id', cicloIds));
  }
  if (cursoQueries.length > 0) {
    const cursoRes = await Promise.all(cursoQueries);
    const seen = new Set<string>();
    for (const res of cursoRes) {
      for (const c of res.data || []) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          cursoIds.push(c.id);
        }
      }
    }
  }

  // 5. Obtener ediciones asociadas (por programa_id o por plan_id)
  const edicionQueries = [
    db.from('ediciones').select('id, codigo, nombre').eq('programa_id', id),
  ];
  if (planIds.length > 0) {
    edicionQueries.push(db.from('ediciones').select('id, codigo, nombre').in('plan_id', planIds));
  }
  const edicionRes = await Promise.all(edicionQueries);
  const edicionIds: string[] = [];
  const seenEd = new Set<string>();
  for (const res of edicionRes) {
    for (const e of res.data || []) {
      if (!seenEd.has(e.id)) {
        seenEd.add(e.id);
        edicionIds.push(e.id);
      }
    }
  }

  // 6. Obtener matrículas asociadas a esas ediciones
  let matIds: string[] = [];
  if (edicionIds.length > 0) {
    const { data: mats } = await db
      .from('matriculas')
      .select('id')
      .in('edicion_id', edicionIds);
    matIds = (mats || []).map((m: { id: string }) => m.id);
  }

  // 7. Obtener cuotas asociadas a esas matrículas
  let cuotaIds: string[] = [];
  if (matIds.length > 0) {
    const { data: cuots } = await db
      .from('cuotas')
      .select('id')
      .in('matricula_id', matIds);
    cuotaIds = (cuots || []).map((c: { id: string }) => c.id);
  }

  // 8. REGISTRO PERMANENTE EN LA BITÁCORA INSTITUCIONAL (audit_logs) ANTES DEL BORRADO FÍSICO
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'programas',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete en Cascada) de programa: ${programa.codigo} - ${programa.nombre} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        programa,
        planes_eliminados: planIds.length,
        ciclos_eliminados: cicloIds.length,
        cursos_eliminados: cursoIds.length,
        ediciones_eliminadas: edicionIds.length,
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
    console.error('Error al registrar auditoría de borrado de programa:', auditErr);
  }

  // =========================================================================
  // 9. CASCADA INVERSA FÍSICA ESTRICTA (CHILDREN FIRST - SIN ERRORES DE FK)
  // =========================================================================

  // A. Eliminar aplicaciones de pagos vinculadas a las cuotas
  if (cuotaIds.length > 0) {
    await db.from('pago_aplicaciones').delete().in('cuota_id', cuotaIds);
  }

  // B. Romper referencias circulares entre prospectos y matrículas, y eliminar cuotas y matrículas
  if (matIds.length > 0) {
    await db.from('cuotas').delete().in('matricula_id', matIds);
    await db.from('prospectos').update({ matricula_id: null }).in('matricula_id', matIds);
    await db.from('matriculas').update({ prospecto_id: null }).in('id', matIds);
    await db.from('matriculas').delete().in('id', matIds);
  }

  // C. Desvincular cualquier otra matrícula que apunte a los ciclos de este programa
  if (cicloIds.length > 0) {
    await db.from('matriculas').update({ ciclo_id: null }).in('ciclo_id', cicloIds);
  }

  // D. Eliminar bloques horarios vinculados a los cursos o a las ediciones
  if (cursoIds.length > 0) {
    await db.from('horarios').delete().in('curso_id', cursoIds);
  }
  if (edicionIds.length > 0) {
    await db.from('horarios').delete().in('edicion_id', edicionIds);
  }

  // E. Desvincular completamente prospectos (programa_id, plan_id, edicion_id)
  await db.from('prospectos').update({ programa_id: null }).eq('programa_id', id);
  if (planIds.length > 0) {
    await db.from('prospectos').update({ plan_id: null }).in('plan_id', planIds);
  }
  if (edicionIds.length > 0) {
    await db.from('prospectos').update({ edicion_id: null }).in('edicion_id', edicionIds);
  }

  // F. Desvincular y eliminar ediciones
  if (planIds.length > 0) {
    await db.from('ediciones').update({ plan_id: null }).in('plan_id', planIds);
  }
  if (cicloIds.length > 0) {
    await db.from('ediciones').update({ ciclo_id: null }).in('ciclo_id', cicloIds);
  }
  if (edicionIds.length > 0) {
    await db.from('ediciones').delete().in('id', edicionIds);
  }
  await db.from('ediciones').delete().eq('programa_id', id);

  // G. Eliminar cursos
  if (cursoIds.length > 0) {
    await db.from('cursos').delete().in('id', cursoIds);
  }
  if (planIds.length > 0) {
    await db.from('cursos').delete().in('plan_id', planIds);
  }
  if (cicloIds.length > 0) {
    await db.from('cursos').delete().in('ciclo_id', cicloIds);
  }

  // H. Eliminar ciclos
  if (cicloIds.length > 0) {
    await db.from('ciclos').delete().in('id', cicloIds);
  }
  if (planIds.length > 0) {
    await db.from('ciclos').delete().in('plan_id', planIds);
  }

  // I. Eliminar planes de estudio
  if (planIds.length > 0) {
    await db.from('planes_estudio').delete().in('id', planIds);
  }
  await db.from('planes_estudio').delete().eq('programa_id', id);

  // J. Eliminar el registro principal en programas
  const { error: delErr } = await db
    .from('programas')
    .delete()
    .eq('id', id);

  if (delErr) {
    return { error: `Error en borrado definitivo de programa: ${delErr.message}` };
  }

  revalidatePath('/oferta/programas');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta');
  revalidatePath('/horarios');
  revalidatePath('/notas');
  revalidatePath('/matriculas');
  revalidatePath('/crm');
  revalidatePath('/auditoria');
  return { success: true };
}

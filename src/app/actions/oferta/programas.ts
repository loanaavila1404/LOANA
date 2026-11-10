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

  // 2. Si el programa aún no tiene ediciones, asegurar Plan + Ciclo + Periodo y crear edición base con los precios
  try {
    const anio = new Date().getFullYear();

    let planId: string | null = null;
    const { data: planExistente } = await supabase
      .from('planes_estudio')
      .select('id')
      .eq('programa_id', programaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planExistente) {
      planId = planExistente.id;
    } else {
      const { data: nuevoPlan } = await supabase
        .from('planes_estudio')
        .insert({
          programa_id: programaId,
          codigo: `PLAN-${codigoPrograma}-${anio}`,
          nombre: `Plan Curricular ${anio}`,
          version: '1.0',
          total_ciclos: totalCiclos || 1,
          status: 'ACTIVO',
        })
        .select('id')
        .maybeSingle();
      planId = nuevoPlan?.id || null;
    }

    if (!planId) return;

    let cicloId: string | null = null;
    const { data: cicloExistente } = await supabase
      .from('ciclos')
      .select('id')
      .eq('plan_id', planId)
      .order('numero_orden', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (cicloExistente) {
      cicloId = cicloExistente.id;
    } else {
      const { data: nuevoCiclo } = await supabase
        .from('ciclos')
        .insert({
          plan_id: planId,
          numero_orden: 1,
          nombre: 'Fundamentos y Formación Base',
          status: 'ACTIVO',
        })
        .select('id')
        .maybeSingle();
      cicloId = nuevoCiclo?.id || null;
    }

    if (!cicloId) return;

    let periodoId: string | null = null;
    const { data: periodoExistente } = await supabase
      .from('periodos')
      .select('id')
      .eq('status', 'ACTIVO')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (periodoExistente) {
      periodoId = periodoExistente.id;
    } else {
      const { data: nuevoPeriodo } = await supabase
        .from('periodos')
        .insert({
          codigo: `${anio}-I`,
          nombre: `Periodo Académico ${anio}-I`,
          status: 'ACTIVO',
        })
        .select('id')
        .maybeSingle();
      periodoId = nuevoPeriodo?.id || null;
    }

    if (!periodoId) return;

    const edCodigo = await generateNextEdicionCodigo(supabase);
    await supabase.from('ediciones').insert({
      programa_id: programaId,
      plan_id: planId,
      periodo_id: periodoId,
      ciclo_id: cicloId,
      codigo: edCodigo,
      nombre: `Grupo Base - ${nombrePrograma}`,
      turno: 'MANANA',
      modalidad: 'PRESENCIAL',
      vacantes: 30,
      precio_matricula: precioMatricula,
      precio_pension: precioPension,
      numero_pensiones: totalCiclos ? totalCiclos * 3 : 6,
      status: 'ACTIVO',
    });
  } catch (err) {
    console.error('Error sincronizando precios en edición base del programa:', err);
  }
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

  // 2. Obtener ediciones y planes asociados
  const [{ data: ediciones }, { data: planes }] = await Promise.all([
    db.from('ediciones').select('id, codigo, nombre').eq('programa_id', id),
    db.from('planes_estudio').select('id, codigo, nombre').eq('programa_id', id),
  ]);

  const edicionIds = (ediciones || []).map((e: { id: string }) => e.id);
  const planIds = (planes || []).map((p: { id: string }) => p.id);

  // 3. Desvincular prospectos que apunten a este programa o a sus ediciones
  await db.from('prospectos').update({ programa_id: null }).eq('programa_id', id);
  if (edicionIds.length > 0) {
    await db.from('prospectos').update({ edicion_id: null }).in('edicion_id', edicionIds);
  }

  // 4. Cascada de ediciones: horarios y matrículas de prueba
  if (edicionIds.length > 0) {
    // Eliminar horarios vinculados a las ediciones
    await db.from('horarios').delete().in('edicion_id', edicionIds);

    // Limpiar matrículas asociadas
    const { data: mats } = await db
      .from('matriculas')
      .select('id')
      .in('edicion_id', edicionIds);

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
      await db.from('matriculas').delete().in('edicion_id', edicionIds);
    }

    // Eliminar ediciones físicamente
    await db.from('ediciones').delete().eq('programa_id', id);
  }

  // 5. Cascada de planes de estudio: cursos, ciclos y planes
  if (planIds.length > 0) {
    const { data: cursos } = await db
      .from('cursos')
      .select('id')
      .in('plan_id', planIds);

    const cursoIds = (cursos || []).map((c: { id: string }) => c.id);
    if (cursoIds.length > 0) {
      await db.from('horarios').delete().in('curso_id', cursoIds);
      await db.from('cursos').delete().in('plan_id', planIds);
    }

    await db.from('ciclos').delete().in('plan_id', planIds);
    await db.from('planes_estudio').delete().eq('programa_id', id);
  }

  // 6. Borrado físico definitivo (Hard Delete) de la tabla programas
  const { error: delErr } = await db
    .from('programas')
    .delete()
    .eq('id', id);

  if (delErr) {
    return { error: `Error en borrado definitivo de programa: ${delErr.message}` };
  }

  // 7. Registro permanente e inalterable en la bitácora institucional (audit_logs)
  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'programas',
      entity_id: id,
      module: 'OFERTA_ACADEMICA',
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de programa: ${programa.codigo} - ${programa.nombre} - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        programa,
        ediciones: ediciones || [],
        planes: planes || [],
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

  revalidatePath('/oferta/programas');
  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta');
  revalidatePath('/auditoria');
  return { success: true };
}

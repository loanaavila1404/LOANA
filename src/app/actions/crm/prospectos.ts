'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, isCurrentUserAdvisor, getUserAuthContext } from '@/lib/auth/permissions';
import { prospectoSchema, transferenciaSchema } from '@/lib/validators/crm';

export async function createProspectoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear prospectos' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  // Generate codigo
  const count = await db.from('prospectos').select('id', { count: 'exact' });
  const num = (count.count || 0) + 1;
  const codigo = `PRO-${new Date().getFullYear()}-${num.toString().padStart(5, '0')}`;

  let asesorId = (formData.get('asesor_id') as string | null)?.trim() || user?.id || null;
  // Seguridad por rol: Si es asesor comercial, forzar la asignación a su propio ID
  if (isAdvisor && user?.id) {
    asesorId = user.id;
  } else if (!asesorId) {
    const { data: firstAdvisor } = await db
      .from('profiles')
      .select('id')
      .eq('status', 'ACTIVO')
      .limit(1)
      .maybeSingle();
    asesorId = firstAdvisor?.id || null;
  }

  const payload = {
    tipo_documento: formData.get('tipo_documento') || null,
    numero_documento: formData.get('numero_documento') || null,
    nombres: formData.get('nombres'),
    apellidos: formData.get('apellidos'),
    telefono: formData.get('telefono'),
    telefono_alt: formData.get('telefono_alt') || null,
    email: formData.get('email') || null,
    departamento: formData.get('departamento') || null,
    provincia: formData.get('provincia') || null,
    distrito: formData.get('distrito') || null,
    programa_id: formData.get('programa_id') || null,
    plan_id: formData.get('plan_id') || null,
    edicion_id: formData.get('edicion_id') || null,
    modalidad: formData.get('modalidad') || null,
    turno: formData.get('turno') || null,
    canal_captacion: formData.get('canal_captacion') || null,
    campana: formData.get('campana') || null,
    asesor_id: asesorId,
    status: formData.get('status') || 'NUEVO',
    nivel_interes: formData.get('nivel_interes') || 'MEDIO',
    consentimiento_contacto: formData.get('consentimiento_contacto') === 'true',
    observaciones: formData.get('observaciones') || null,
  };

  const parsed = prospectoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await db.from('prospectos').insert({
    ...parsed.data,
    codigo,
    created_by: user?.id
  }).select().single();

  if (error) return { error: 'Error al crear el prospecto: ' + error.message };

  revalidatePath('/crm');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function updateProspectoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar prospectos' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  // Validación de seguridad para Asesor Comercial: Solo puede editar sus propios prospectos asignados
  if (isAdvisor && user?.id) {
    const { data: existing } = await db.from('prospectos').select('asesor_id').eq('id', id).single();
    if (!existing || existing.asesor_id !== user.id) {
      return { error: 'No tienes permiso para modificar prospectos asignados a otros asesores.' };
    }
  }

  let asesorId = (formData.get('asesor_id') as string | null)?.trim() || user?.id || null;
  // Un asesor nunca puede reasignar el prospecto a otro asesor
  if (isAdvisor && user?.id) {
    asesorId = user.id;
  }

  const payload = {
    tipo_documento: formData.get('tipo_documento') || null,
    numero_documento: formData.get('numero_documento') || null,
    nombres: formData.get('nombres'),
    apellidos: formData.get('apellidos'),
    telefono: formData.get('telefono'),
    telefono_alt: formData.get('telefono_alt') || null,
    email: formData.get('email') || null,
    departamento: formData.get('departamento') || null,
    provincia: formData.get('provincia') || null,
    distrito: formData.get('distrito') || null,
    programa_id: formData.get('programa_id') || null,
    plan_id: formData.get('plan_id') || null,
    edicion_id: formData.get('edicion_id') || null,
    modalidad: formData.get('modalidad') || null,
    turno: formData.get('turno') || null,
    canal_captacion: formData.get('canal_captacion') || null,
    campana: formData.get('campana') || null,
    asesor_id: asesorId,
    status: formData.get('status') || 'NUEVO',
    nivel_interes: formData.get('nivel_interes') || null,
    consentimiento_contacto: formData.get('consentimiento_contacto') === 'true',
    observaciones: formData.get('observaciones') || null,
  };

  const parsed = prospectoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await db.from('prospectos').update({
    ...parsed.data,
    updated_by: user?.id
  }).eq('id', id).select().single();

  if (error) return { error: 'Error al actualizar el prospecto' };

  revalidatePath('/crm');
  revalidatePath(`/crm/prospectos/${id}`);
  return { success: true, data };
}

export async function updateProspectoStatusAction(id: string, status: string, motivo_perdida?: string, detalle_perdida?: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  // Validación de seguridad para Asesor Comercial: Solo puede cambiar el estado de sus propios prospectos
  if (isAdvisor && user?.id) {
    const { data: existing } = await db.from('prospectos').select('asesor_id').eq('id', id).single();
    if (!existing || existing.asesor_id !== user.id) {
      return { error: 'No tienes permiso para modificar el estado de este prospecto.' };
    }
  }

  const updateFields: {
    status: string;
    motivo_perdida: string | null;
    detalle_perdida: string | null;
    updated_by?: string | null;
    ultimo_contacto_en?: string | null;
  } = {
    status,
    motivo_perdida: motivo_perdida || null,
    detalle_perdida: detalle_perdida || null,
    updated_by: user?.id,
  };

  if (status !== 'NUEVO') {
    updateFields.ultimo_contacto_en = new Date().toISOString();
  }

  const { data, error } = await db
    .from('prospectos')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: 'Error al cambiar estado' };

  revalidatePath('/crm');
  revalidatePath(`/crm/prospectos/${id}`);
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function transferProspectoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para reasignar prospectos' };
  }

  const isAdvisor = await isCurrentUserAdvisor();
  if (isAdvisor) {
    return { error: 'Solo los supervisores y administradores tienen permiso para reasignar prospectos.' };
  }

  const payload = {
    prospecto_id: formData.get('prospecto_id'),
    asesor_nuevo_id: formData.get('asesor_nuevo_id'),
    motivo: formData.get('motivo'),
  };

  const parsed = transferenciaSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;

  // Get current asesor
  const { data: prospecto } = await db.from('prospectos').select('asesor_id').eq('id', parsed.data.prospecto_id).single();
  if (!prospecto) return { error: 'Prospecto no encontrado' };

  if (prospecto.asesor_id === parsed.data.asesor_nuevo_id) {
    return { error: 'El prospecto ya está asignado a este asesor' };
  }

  // Insert transferencia
  const { error: trError } = await db.from('transferencias_prospectos').insert({
    prospecto_id: parsed.data.prospecto_id,
    asesor_anterior_id: prospecto.asesor_id,
    asesor_nuevo_id: parsed.data.asesor_nuevo_id,
    motivo: parsed.data.motivo,
    usuario_id: user?.id,
    created_by: user?.id
  });

  if (trError) return { error: 'Error al registrar la transferencia' };

  // Update prospecto
  const { error: updError } = await db.from('prospectos').update({
    asesor_id: parsed.data.asesor_nuevo_id,
    updated_by: user?.id
  }).eq('id', parsed.data.prospecto_id);

  if (updError) return { error: 'Error al actualizar el asesor' };

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  revalidatePath('/crm');
  return { success: true };
}


export async function convertirAEstudianteAction(prospectoId: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para realizar esta acción.' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const isAdvisor = await isCurrentUserAdvisor();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: p, error: pError } = await db.from('prospectos').select('*').eq('id', prospectoId).single();
  if (pError || !p) return { error: 'Prospecto no encontrado.' };

  // Seguridad: Asesor Comercial solo puede convertir sus propios prospectos asignados
  if (isAdvisor && user?.id && p.asesor_id !== user.id) {
    return { error: 'No tienes permiso para derivar prospectos de otros asesores.' };
  }

  // Idempotency: si ya tiene prematrícula generada
  if (p.status === 'PREMATRICULA' && p.persona_id && p.estudiante_id && p.matricula_id) {
    return { success: true, matricula_id: p.matricula_id, status: 'PREMATRICULA' };
  }

  // Si ya está matriculado formalmente con pago
  if (p.status === 'MATRICULADO' && p.estudiante_id) {
    return { success: true, status: 'MATRICULADO' };
  }

  // Requisito: Bloquear si no tiene documento de identidad
  if (!p.tipo_documento || !p.numero_documento) {
    return { error: 'El prospecto no cuenta con documento de identidad completo. Por favor, edita sus datos antes de generar su prematrícula.' };
  }

  // 1. Buscar o Crear Persona (sin duplicados por tipo y número de documento)
  let personaId = p.persona_id;
  if (!personaId) {
    const { data: existingPersona, error: exPError } = await db
      .from('personas')
      .select('id')
      .eq('tipo_documento', p.tipo_documento)
      .eq('numero_documento', p.numero_documento)
      .single();

    if (existingPersona) {
      personaId = existingPersona.id;
    } else if (exPError && exPError.code !== 'PGRST116') {
      return { error: 'Error al buscar persona existente.' };
    } else {
      // Crear Persona
      const { data: newPersona, error: insPError } = await db.from('personas').insert({
        tipo_documento: p.tipo_documento,
        numero_documento: p.numero_documento,
        nombres: p.nombres,
        apellido_paterno: p.apellidos,
        email: p.email,
        telefono: p.telefono,
        status: 'ACTIVO'
      }).select('id').single();

      if (insPError || !newPersona) return { error: 'Error al crear el registro de persona: ' + (insPError?.message || '') };
      personaId = newPersona.id;
    }
  }

  // 2. Buscar o Crear Estudiante en estado INACTIVO (no activo hasta validación de pago en Caja)
  let estudianteId = p.estudiante_id;
  if (!estudianteId) {
    const { data: existingEstudiante, error: exEError } = await db
      .from('estudiantes')
      .select('id, status')
      .eq('persona_id', personaId)
      .single();

    if (existingEstudiante) {
      estudianteId = existingEstudiante.id;
    } else if (exEError && exEError.code !== 'PGRST116') {
      return { error: 'Error al buscar estudiante existente.' };
    } else {
      // Crear Estudiante con status 'INACTIVO' para NO saltarse Caja ni inflar el padrón de alumnos activos
      const { data: newEstudiante, error: insEError } = await db.from('estudiantes').insert({
        persona_id: personaId,
        status: 'INACTIVO',
        observaciones: 'Prospecto en proceso de admisión/prematrícula. Requiere validación de pago en Caja para activación formal.',
        created_by: user?.id
      }).select('id').single();

      if (insEError || !newEstudiante) return { error: 'Error al crear el registro de estudiante: ' + (insEError?.message || '') };
      estudianteId = newEstudiante.id;
    }
  }

  // 3. Obtener Edición Académica vinculada o vigente del programa
  let edicionId = p.edicion_id;
  let edicionObj: { id: string; precio_matricula?: number | null; precio_pension?: number | null; numero_pensiones?: number | null; frecuencia_meses?: number | null; primer_vencimiento?: string | null } | null = null;

  if (edicionId) {
    const { data: ed } = await db.from('ediciones').select('id, precio_matricula, precio_pension, numero_pensiones, frecuencia_meses, primer_vencimiento').eq('id', edicionId).single();
    if (ed) edicionObj = ed;
  }

  if (!edicionObj && p.programa_id) {
    const { data: edProg } = await db
      .from('ediciones')
      .select('id, precio_matricula, precio_pension, numero_pensiones, frecuencia_meses, primer_vencimiento')
      .eq('programa_id', p.programa_id)
      .eq('status', 'ACTIVO')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (edProg) {
      edicionObj = edProg;
      edicionId = edProg.id;
    }
  }

  // 4. Crear o enlazar registro de PREMATRICULA
  let matriculaId = p.matricula_id;
  if (!matriculaId && edicionId) {
    // Verificar si ya existe matrícula para este estudiante y edición
    const { data: existingMat } = await db
      .from('matriculas')
      .select('id, status')
      .eq('estudiante_id', estudianteId)
      .eq('edicion_id', edicionId)
      .maybeSingle();

    if (existingMat) {
      matriculaId = existingMat.id;
    } else {
      const docSuffix = p.numero_documento ? p.numero_documento.slice(-5) : Math.floor(10000 + Math.random() * 90000);
      const codigoMat = `PRE-${docSuffix}`;

      const { data: newMat, error: insMError } = await db.from('matriculas').insert({
        codigo_matricula: codigoMat,
        estudiante_id: estudianteId,
        edicion_id: edicionId,
        prospecto_id: prospectoId,
        asesor_comercial_id: p.asesor_id || user?.id,
        status: 'PREMATRICULA',
        fecha_prematricula: new Date().toISOString(),
        importe_matricula: edicionObj?.precio_matricula || 0,
        importe_pension: edicionObj?.precio_pension || 0,
        numero_pensiones: edicionObj?.numero_pensiones || 1,
        frecuencia_meses: edicionObj?.frecuencia_meses || 1,
        primer_vencimiento: edicionObj?.primer_vencimiento || null,
        observaciones: 'Prematrícula generada desde CRM Comercial. Pendiente de pago inicial y validación en Caja.',
        created_by: user?.id
      }).select('id').single();

      if (!insMError && newMat) {
        matriculaId = newMat.id;
      }
    }
  }

  // 5. Actualizar Prospecto a etapa PREMATRICULA (sin saltarse Caja)
  const estadoAnterior = p.status;
  const { error: updError } = await db.from('prospectos').update({
    status: 'PREMATRICULA',
    persona_id: personaId,
    estudiante_id: estudianteId,
    edicion_id: edicionId || p.edicion_id,
    matricula_id: matriculaId || p.matricula_id,
    fecha_conversion: new Date().toISOString(),
    asesor_conversion_id: p.asesor_id || user?.id,
    updated_by: user?.id
  }).eq('id', prospectoId);

  if (updError) return { error: 'Error al actualizar el estado del prospecto: ' + updError.message };

  // 6. Auditoría y Bitácora permanente en seguimientos
  await db.from('seguimientos').insert({
    prospecto_id: prospectoId,
    tipo_actividad: 'NOTA_INTERNA',
    resultado: 'Prematrícula Generada',
    nota: 'Prospecto derivado a Matrículas con estado PREMATRÍCULA. Requiere validación financiera obligatoria y registro de pago en Caja para su admisión formal.',
    fecha_hora: new Date().toISOString(),
    estado_anterior: estadoAnterior,
    estado_nuevo: 'PREMATRICULA',
    asesor_id: user?.id,
    created_by: user?.id
  });

  revalidatePath('/crm/prospectos/' + prospectoId);
  revalidatePath('/crm');
  revalidatePath('/matriculas');
  return { success: true, matricula_id: matriculaId, status: 'PREMATRICULA' };
}

export async function deleteProspectoAction(id: string, motivo?: string) {
  const authCtx = await getUserAuthContext();
  const permissions = authCtx?.permissions || [];
  if (
    !permissions.includes('CRM.GESTIONAR') &&
    !permissions.includes('CRM.ADMINISTRAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No tienes permiso para eliminar prospectos.' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = authCtx?.isAsesor ?? (await isCurrentUserAdvisor());

  // 1. Obtener snapshot completo del prospecto
  const { data: p, error: pError } = await db
    .from('prospectos')
    .select('*')
    .eq('id', id)
    .single();

  if (pError || !p) {
    return { error: 'Prospecto no encontrado.' };
  }

  // Si es Asesor Comercial, solo puede eliminar prospectos que tiene asignados
  if (isAdvisor && user?.id && p.asesor_id !== user.id) {
    return { error: 'No tienes permiso para eliminar prospectos de otros asesores.' };
  }

  // Protección: No permitir eliminar si ya tiene matrícula ACTIVA
  if (p.matricula_id) {
    const { data: mat } = await db
      .from('matriculas')
      .select('status')
      .eq('id', p.matricula_id)
      .maybeSingle();
    if (mat && mat.status === 'ACTIVA') {
      return {
        error: 'Este prospecto ya cuenta con una matrícula ACTIVA validada en Caja y no puede ser eliminado desde el CRM.',
      };
    }
  }

  const motivoTexto = (motivo || 'Eliminación física definitiva autorizada en CRM').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  // 2. Obtener snapshots de actividades para la bitácora
  const [{ data: tareas }, { data: transferencias }, { data: seguimientos }] = await Promise.all([
    db.from('tareas_comerciales').select('*').eq('prospecto_id', id),
    db.from('transferencias_prospectos').select('*').eq('prospecto_id', id),
    db.from('seguimientos').select('*').eq('prospecto_id', id),
  ]);

  // 3. REGISTRO PREVIO EN AUDITORÍA ANTES DEL BORRADO FÍSICO
  try {
    const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'prospectos',
      entity_id: id,
      module: 'CRM',
      user_id: user?.id || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'USUARIO',
      detail: `Eliminación física definitiva (Hard Delete) de prospecto ${p.codigo || id} (${nombreCompleto}) - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        prospecto: p,
        tareas_comerciales: tareas || [],
        transferencias: transferencias || [],
        seguimientos: seguimientos || [],
        fecha_eliminacion: now.toISOString(),
        eliminado_por: user?.email || 'Usuario',
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
    console.warn('[deleteProspectoAction] Error audit:', auditErr);
  }

  // 4. Cascada de eliminación física de dependencias hijas del prospecto
  await db.from('tareas_comerciales').delete().eq('prospecto_id', id);
  await db.from('transferencias_prospectos').delete().eq('prospecto_id', id);
  await db.from('seguimientos').delete().eq('prospecto_id', id);

  // 5. Desvincular matrículas que apunten a este prospecto y limpiar campos circulares
  await db.from('matriculas').update({ prospecto_id: null }).eq('prospecto_id', id);
  await db.from('prospectos').update({ matricula_id: null }).eq('id', id);

  // 6. Borrado físico definitivo (Hard Delete) de la tabla prospectos
  const { error: delError } = await db
    .from('prospectos')
    .delete()
    .eq('id', id);

  if (delError) {
    return { error: `Error en borrado definitivo del prospecto: ${delError.message}` };
  }

  revalidatePath('/crm');
  revalidatePath('/dashboard');
  revalidatePath('/auditoria');
  return { success: true };
}


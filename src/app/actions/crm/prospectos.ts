'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { prospectoSchema, transferenciaSchema } from '@/lib/validators/crm';

export async function createProspectoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear prospectos' };
  }

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  // Generate codigo
  const count = await supabase.from('prospectos').select('id', { count: 'exact' });
  const num = (count.count || 0) + 1;
  const codigo = `PRO-${new Date().getFullYear()}-${num.toString().padStart(5, '0')}`;

  let asesorId = (formData.get('asesor_id') as string | null)?.trim() || user?.id || null;
  if (!asesorId) {
    const { data: firstAdvisor } = await supabase
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

  const { data, error } = await supabase.from('prospectos').insert({
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
  const user = (await supabase.auth.getUser()).data.user;

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
    asesor_id: (formData.get('asesor_id') as string | null)?.trim() || user?.id || null,
    status: formData.get('status') || 'NUEVO',
    nivel_interes: formData.get('nivel_interes') || null,
    consentimiento_contacto: formData.get('consentimiento_contacto') === 'true',
    observaciones: formData.get('observaciones') || null,
  };

  const parsed = prospectoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase.from('prospectos').update({
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
  const user = (await supabase.auth.getUser()).data.user;

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

  const { data, error } = await supabase
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

  const payload = {
    prospecto_id: formData.get('prospecto_id'),
    asesor_nuevo_id: formData.get('asesor_nuevo_id'),
    motivo: formData.get('motivo'),
  };

  const parsed = transferenciaSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  // Get current asesor
  const { data: prospecto } = await supabase.from('prospectos').select('asesor_id').eq('id', parsed.data.prospecto_id).single();
  if (!prospecto) return { error: 'Prospecto no encontrado' };

  if (prospecto.asesor_id === parsed.data.asesor_nuevo_id) {
    return { error: 'El prospecto ya está asignado a este asesor' };
  }

  // Insert transferencia
  const { error: trError } = await supabase.from('transferencias_prospectos').insert({
    prospecto_id: parsed.data.prospecto_id,
    asesor_anterior_id: prospecto.asesor_id,
    asesor_nuevo_id: parsed.data.asesor_nuevo_id,
    motivo: parsed.data.motivo,
    usuario_id: user?.id,
    created_by: user?.id
  });

  if (trError) return { error: 'Error al registrar la transferencia' };

  // Update prospecto
  const { error: updError } = await supabase.from('prospectos').update({
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
  const { data: { user } } = await supabase.auth.getUser();

  const { data: p, error: pError } = await db.from('prospectos').select('*').eq('id', prospectoId).single();
  if (pError || !p) return { error: 'Prospecto no encontrado.' };

  // Idempotency: if already has both IDs, it is already converted
  if (p.persona_id && p.estudiante_id) {
    return { success: true };
  }

  // Requirement: block if no document
  if (!p.tipo_documento || !p.numero_documento) {
    return { error: 'El prospecto no cuenta con documento de identidad completo. Por favor, edita sus datos antes de convertirlo.' };
  }

  // 1. Check or Create Persona
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
      // Create Persona
      const { data: newPersona, error: insPError } = await db.from('personas').insert({
        tipo_documento: p.tipo_documento,
        numero_documento: p.numero_documento,
        nombres: p.nombres,
        apellido_paterno: p.apellidos,
        email: p.email,
        telefono: p.telefono
      }).select('id').single();

      if (insPError || !newPersona) return { error: 'Error al crear el registro de persona: ' + (insPError?.message || '') };
      personaId = newPersona.id;
    }
  }

  // 2. Check or Create Estudiante
  let estudianteId = p.estudiante_id;
  if (!estudianteId) {
    const { data: existingEstudiante, error: exEError } = await db
      .from('estudiantes')
      .select('id')
      .eq('persona_id', personaId)
      .single();

    if (existingEstudiante) {
      estudianteId = existingEstudiante.id;
    } else if (exEError && exEError.code !== 'PGRST116') {
      return { error: 'Error al buscar estudiante existente.' };
    } else {
      // Create Estudiante
      const { data: newEstudiante, error: insEError } = await db.from('estudiantes').insert({
        persona_id: personaId,
        status: 'ACTIVO',
        created_by: user?.id
      }).select('id').single();

      if (insEError || !newEstudiante) return { error: 'Error al crear el registro de estudiante: ' + (insEError?.message || '') };
      estudianteId = newEstudiante.id;
    }
  }

  // 3. Update Prospecto with both IDs and MATRICULADO status
  const { error: updError } = await db.from('prospectos').update({
    status: 'MATRICULADO',
    persona_id: personaId,
    estudiante_id: estudianteId,
    fecha_conversion: new Date().toISOString(),
    asesor_conversion_id: p.asesor_id || user?.id,
    updated_by: user?.id
  }).eq('id', prospectoId);

  if (updError) return { error: 'Error al actualizar el estado del prospecto: ' + updError.message };

  revalidatePath('/crm/prospectos/' + prospectoId);
  revalidatePath('/crm');
  return { success: true };
}

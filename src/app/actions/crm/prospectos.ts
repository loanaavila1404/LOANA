'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
  const codigo = `PRO-${new Date().getFullYear()}-${num.toString().padStart(5, '0')}`; // Minimal fallback, in the future this should be a DB sequence, but no RPC is available for PROSPECTOS in 00005, only for Estudiantes in Phase 6.

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
    asesor_id: formData.get('asesor_id') || user?.id,
    status: formData.get('status') || 'NUEVO',
    nivel_interes: formData.get('nivel_interes') || null,
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

  if (error) return { error: 'Error al crear el prospecto' };

  revalidatePath('/crm');
  return { success: true, data };
}

export async function updateProspectoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar prospectos' };
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
    asesor_id: formData.get('asesor_id') || null,
    status: formData.get('status') || 'NUEVO',
    nivel_interes: formData.get('nivel_interes') || null,
    consentimiento_contacto: formData.get('consentimiento_contacto') === 'true',
    observaciones: formData.get('observaciones') || null,
  };

  const parsed = prospectoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  // We should not blindly update asesor_id if it's a transfer, transfer has its own action.
  const { data, error } = await supabase.from('prospectos').update({
    ...parsed.data,
    updated_by: user?.id
  }).eq('id', id).select().single();

  if (error) return { error: 'Error al actualizar el prospecto' };

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

  const { data, error } = await supabase.from('prospectos').update({
    status,
    motivo_perdida: motivo_perdida || null,
    detalle_perdida: detalle_perdida || null,
    updated_by: user?.id
  }).eq('id', id).select().single();

  if (error) return { error: 'Error al cambiar estado' };

  revalidatePath(`/crm/prospectos/${id}`);
  return { success: true, data };
}

export async function transferProspectoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.ADMINISTRAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
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
  await supabase.from('prospectos').update({
    asesor_id: parsed.data.asesor_nuevo_id,
    updated_by: user?.id
  }).eq('id', parsed.data.prospecto_id);

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  revalidatePath('/crm');
  return { success: true };
}

export async function convertirAEstudianteAction(prospectoId: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) return { error: 'No tienes permiso' };
  
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  
  const { data: p } = await supabase.from('prospectos').select('*').eq('id', prospectoId).single();
  if (!p) return { error: 'Prospecto no encontrado' };
  if (p.status === 'MATRICULADO') return { error: 'Ya fue convertido' };
  
  const { data: persona, error: perError } = await supabase.from('personas').insert({ 
    tipo_documento: p.tipo_documento, 
    numero_documento: p.numero_documento, 
    nombres: p.nombres, 
    apellido_paterno: p.apellidos, 
    email: p.email, 
    telefono: p.telefono 
  }).select().single();
  
  if (perError) return { error: 'Error al crear persona' };
  
  const { data: estudiante, error: estError } = await supabase.from('estudiantes').insert({ 
    persona_id: persona.id, 
    status: 'ACTIVO', 
    created_by: user?.id 
  }).select().single();
  
  if (estError) return { error: 'Error al crear estudiante' };
  
  await supabase.from('prospectos').update({ 
    status: 'MATRICULADO', 
    persona_id: persona.id, 
    estudiante_id: estudiante.id, 
    fecha_conversion: new Date().toISOString(), 
    asesor_conversion_id: p.asesor_id || user?.id,
    updated_by: user?.id
  }).eq('id', prospectoId);
  
  revalidatePath('/crm/prospectos/' + prospectoId);
  revalidatePath('/crm');
  return { success: true };
}

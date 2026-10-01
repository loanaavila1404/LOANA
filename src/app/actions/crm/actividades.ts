'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { seguimientoSchema, tareaSchema } from '@/lib/validators/crm';

export async function createSeguimientoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso' };
  }

  const payload = {
    prospecto_id: formData.get('prospecto_id'),
    tipo_actividad: formData.get('tipo_actividad'),
    resultado: formData.get('resultado') || null,
    nota: formData.get('nota'),
    estado_nuevo: formData.get('estado_nuevo') || null,
    proximo_seguimiento: formData.get('proximo_seguimiento') || null,
  };

  const parsed = seguimientoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  // Get current status
  const { data: prospecto } = await supabase.from('prospectos').select('status, asesor_id').eq('id', parsed.data.prospecto_id).single();
  const estado_anterior = prospecto?.status;

  const { error } = await supabase.from('seguimientos').insert({
    ...parsed.data,
    asesor_id: prospecto?.asesor_id || user?.id,
    fecha_hora: new Date().toISOString(),
    estado_anterior,
    created_by: user?.id
  });

  if (error) return { error: 'Error al registrar seguimiento' };

  // Update prospecto if status changed or proximo_seguimiento updated
  const updates: any = { ultimo_contacto_en: new Date().toISOString(), updated_by: user?.id };
  if (parsed.data.estado_nuevo && parsed.data.estado_nuevo !== estado_anterior) {
    updates.status = parsed.data.estado_nuevo;
  }
  if (parsed.data.proximo_seguimiento) {
    updates.proximo_seguimiento_en = parsed.data.proximo_seguimiento;
  }
  await supabase.from('prospectos').update(updates).eq('id', parsed.data.prospecto_id);

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  return { success: true };
}

export async function createTareaAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso' };
  }

  const payload = {
    prospecto_id: formData.get('prospecto_id'),
    tipo_tarea: formData.get('tipo_tarea'),
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion') || null,
    fecha_programada: formData.get('fecha_programada'),
    status: formData.get('status') || 'PENDIENTE',
  };

  const parsed = tareaSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  const { data: prospecto } = await supabase.from('prospectos').select('asesor_id').eq('id', parsed.data.prospecto_id).single();

  const { error } = await supabase.from('tareas_comerciales').insert({
    ...parsed.data,
    asesor_id: prospecto?.asesor_id || user?.id,
    created_by: user?.id
  });

  if (error) return { error: 'Error al programar la tarea' };

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  return { success: true };
}

export async function completeTareaAction(id: string, prospecto_id: string, resultado: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso' };
  }

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

  const { error } = await supabase.from('tareas_comerciales').update({
    status: 'COMPLETADA',
    fecha_realizada: new Date().toISOString(),
    resultado,
    updated_by: user?.id
  }).eq('id', id);

  if (error) return { error: 'Error al completar la tarea' };

  revalidatePath(`/crm/prospectos/${prospecto_id}`);
  return { success: true };
}

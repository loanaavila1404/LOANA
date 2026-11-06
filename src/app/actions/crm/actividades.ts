'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, isCurrentUserAdvisor } from '@/lib/auth/permissions';
import { seguimientoSchema, tareaSchema } from '@/lib/validators/crm';

export async function createSeguimientoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
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
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  // Get current status & check ownership
  const { data: prospecto } = await db.from('prospectos').select('status, asesor_id').eq('id', parsed.data.prospecto_id).single();
  if (!prospecto) return { error: 'Prospecto no encontrado' };

  if (isAdvisor && user?.id && prospecto.asesor_id !== user.id) {
    return { error: 'No tienes permiso para registrar actividades en prospectos de otros asesores.' };
  }

  const estado_anterior = prospecto?.status;

  const { data: newSeg, error } = await db
    .from('seguimientos')
    .insert({
      ...parsed.data,
      asesor_id: prospecto?.asesor_id || user?.id,
      fecha_hora: new Date().toISOString(),
      estado_anterior,
      created_by: user?.id
    })
    .select(`
      id,
      prospecto_id,
      tipo_actividad,
      fecha_hora,
      resultado,
      nota,
      estado_anterior,
      estado_nuevo,
      proximo_seguimiento,
      asesor_id,
      profiles!seguimientos_asesor_id_fkey (id, display_name, email)
    `)
    .single();

  if (error) return { error: 'Error al registrar seguimiento: ' + error.message };

  // Update prospecto if status changed or proximo_seguimiento updated
  const updates: any = { ultimo_contacto_en: new Date().toISOString(), updated_by: user?.id };
  if (parsed.data.estado_nuevo && parsed.data.estado_nuevo !== estado_anterior) {
    updates.status = parsed.data.estado_nuevo;
  }
  if (parsed.data.proximo_seguimiento) {
    updates.proximo_seguimiento_en = parsed.data.proximo_seguimiento;
  }
  const { error: updError } = await db.from('prospectos').update(updates).eq('id', parsed.data.prospecto_id);
  if (updError) return { error: 'Error al actualizar prospecto' };

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  revalidatePath('/crm');
  return { success: true, data: newSeg };
}

export async function createTareaAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
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
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  const { data: prospecto } = await db.from('prospectos').select('asesor_id').eq('id', parsed.data.prospecto_id).single();
  if (!prospecto) return { error: 'Prospecto no encontrado' };

  if (isAdvisor && user?.id && prospecto.asesor_id !== user.id) {
    return { error: 'No tienes permiso para programar tareas en prospectos de otros asesores.' };
  }

  const { data: newTarea, error } = await db
    .from('tareas_comerciales')
    .insert({
      ...parsed.data,
      asesor_id: prospecto?.asesor_id || user?.id,
      created_by: user?.id
    })
    .select(`
      id,
      prospecto_id,
      asesor_id,
      tipo_tarea,
      titulo,
      descripcion,
      fecha_programada,
      fecha_realizada,
      status,
      resultado,
      created_at,
      profiles!tareas_comerciales_asesor_id_fkey (id, display_name, email)
    `)
    .single();

  if (error) return { error: 'Error al programar la tarea: ' + error.message };

  revalidatePath(`/crm/prospectos/${parsed.data.prospecto_id}`);
  revalidatePath('/crm');
  return { success: true, data: newTarea };
}

export async function completeTareaAction(id: string, prospecto_id: string, resultado: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso' };
  }

  const supabase = await createClient();
  const db = await getSafeDbClient();
  const user = (await supabase.auth.getUser()).data.user;
  const isAdvisor = await isCurrentUserAdvisor();

  if (isAdvisor && user?.id) {
    const { data: tarea } = await db.from('tareas_comerciales').select('asesor_id').eq('id', id).single();
    if (tarea && tarea.asesor_id && tarea.asesor_id !== user.id) {
      return { error: 'No tienes permiso para completar tareas asignadas a otros asesores.' };
    }
  }

  const { data: updatedTarea, error } = await db
    .from('tareas_comerciales')
    .update({
      status: 'COMPLETADA',
      fecha_realizada: new Date().toISOString(),
      resultado,
      updated_by: user?.id
    })
    .eq('id', id)
    .select(`
      id,
      prospecto_id,
      asesor_id,
      tipo_tarea,
      titulo,
      descripcion,
      fecha_programada,
      fecha_realizada,
      status,
      resultado,
      created_at,
      profiles!tareas_comerciales_asesor_id_fkey (id, display_name, email)
    `)
    .single();

  if (error) return { error: 'Error al completar la tarea: ' + error.message };

  // Registrar también en seguimientos para bitácora permanente correlacionada
  await db.from('seguimientos').insert({
    prospecto_id,
    tipo_actividad: updatedTarea?.tipo_tarea || 'TAREA',
    resultado: `Tarea completada: ${resultado}`,
    nota: `Cumplimiento de tarea programada: "${updatedTarea?.titulo || 'Seguimiento'}".`,
    fecha_hora: new Date().toISOString(),
    asesor_id: user?.id,
    created_by: user?.id
  });

  revalidatePath(`/crm/prospectos/${prospecto_id}`);
  revalidatePath('/crm');
  return { success: true, data: updatedTarea };
}

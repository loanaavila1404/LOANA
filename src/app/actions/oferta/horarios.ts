'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { horarioSchema } from '@/lib/validators/oferta';

export async function createHorarioAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear horarios' };
  }

  const payload = {
    edicion_id: formData.get('edicion_id'),
    curso_id: formData.get('curso_id'),
    dia_semana: formData.get('dia_semana'),
    hora_inicio: formData.get('hora_inicio'),
    hora_fin: formData.get('hora_fin'),
    ubicacion: formData.get('ubicacion') || null,
    docente: formData.get('docente') || null,
    observaciones: formData.get('observaciones') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = horarioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('horarios').insert({
    ...parsed.data,
    created_by: (await supabase.auth.getUser()).data.user?.id
  }).select().single();
  
  if (error) return { error: 'Ocurrió un error al crear el horario' };

  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}`);
  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}/ficha`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updateHorarioAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar horarios' };
  }

  const payload = {
    edicion_id: formData.get('edicion_id'),
    curso_id: formData.get('curso_id'),
    dia_semana: formData.get('dia_semana'),
    hora_inicio: formData.get('hora_inicio'),
    hora_fin: formData.get('hora_fin'),
    ubicacion: formData.get('ubicacion') || null,
    docente: formData.get('docente') || null,
    observaciones: formData.get('observaciones') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = horarioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('horarios').update({
    ...parsed.data,
    updated_by: (await supabase.auth.getUser()).data.user?.id
  }).eq('id', id).select().single();
  
  if (error) return { error: 'Ocurrió un error al actualizar el horario' };

  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}`);
  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}/ficha`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

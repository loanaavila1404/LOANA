'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { periodoSchema } from '@/lib/validators/oferta';

export async function createPeriodoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear periodos' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = periodoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('periodos').select('id').eq('codigo', parsed.data.codigo).single();
  if (existing) return { error: 'Ya existe un periodo con este código' };

  const { data, error } = await supabase.from('periodos').insert(parsed.data).select().single();
  if (error) return { error: 'Ocurrió un error al crear el periodo' };

  revalidatePath('/oferta/periodos');
  return { success: true, data };
}

export async function updatePeriodoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar periodos' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = periodoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('periodos').select('id').eq('codigo', parsed.data.codigo).neq('id', id).single();
  if (existing) return { error: 'Ya existe otro periodo con este código' };

  const { data, error } = await supabase.from('periodos').update(parsed.data).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar el periodo' };

  revalidatePath('/oferta/periodos');
  return { success: true, data };
}

export async function togglePeriodoStatusAction(id: string, currentStatus: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para modificar periodos' };
  }

  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const supabase = await createClient();

  const { data, error } = await supabase.from('periodos').update({ status: newStatus }).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar el estado' };

  revalidatePath('/oferta/periodos');
  return { success: true, data };
}

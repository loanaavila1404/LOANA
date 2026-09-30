'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { edicionSchema } from '@/lib/validators/oferta';

export async function createEdicionAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear ediciones' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    plan_id: formData.get('plan_id'),
    periodo_id: formData.get('periodo_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre') || null,
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    turno: formData.get('turno') || null,
    modalidad: formData.get('modalidad') || null,
    vacantes: formData.get('vacantes') || null,
    precio_matricula: formData.get('precio_matricula') || null,
    precio_pension: formData.get('precio_pension') || null,
    numero_pensiones: formData.get('numero_pensiones') || null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).single();
  if (existing) return { error: 'Ya existe una edición con este código' };

  // Nota de Fase 4 Checkpoint 2: No pasamos sede_id porque todavía NEXT_PUBLIC_SEDES_ENABLED=false
  const { data, error } = await supabase.from('ediciones').insert(parsed.data).select().single();
  if (error) return { error: 'Ocurrió un error al crear la edición' };

  revalidatePath('/oferta/ediciones');
  return { success: true, data };
}

export async function updateEdicionAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar ediciones' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    plan_id: formData.get('plan_id'),
    periodo_id: formData.get('periodo_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre') || null,
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    turno: formData.get('turno') || null,
    modalidad: formData.get('modalidad') || null,
    vacantes: formData.get('vacantes') || null,
    precio_matricula: formData.get('precio_matricula') || null,
    precio_pension: formData.get('precio_pension') || null,
    numero_pensiones: formData.get('numero_pensiones') || null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).neq('id', id).single();
  if (existing) return { error: 'Ya existe otra edición con este código' };

  const { data, error } = await supabase.from('ediciones').update(parsed.data).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar la edición' };

  revalidatePath('/oferta/ediciones');
  return { success: true, data };
}

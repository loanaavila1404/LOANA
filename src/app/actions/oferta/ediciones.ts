'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { edicionSchema } from '@/lib/validators/oferta';

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

export async function getNextEdicionCodigoAction(): Promise<string> {
  const supabase = await createClient();
  return generateNextEdicionCodigo(supabase);
}

export async function createEdicionAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear ediciones' };
  }

  const supabase = await createClient();
  const rawCodigo = String(formData.get('codigo') || '').trim().toUpperCase();
  const finalCodigo = rawCodigo || (await generateNextEdicionCodigo(supabase));

  const payload = {
    programa_id: formData.get('programa_id'),
    plan_id: formData.get('plan_id'),
    periodo_id: formData.get('periodo_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: finalCodigo,
    nombre: formData.get('nombre') || null,
    fecha_inicio: formData.get('fecha_inicio') || null,
    fecha_fin: formData.get('fecha_fin') || null,
    turno: formData.get('turno') || null,
    modalidad: formData.get('modalidad') || null,
    vacantes: formData.get('vacantes') || null,
    precio_matricula: formData.get('precio_matricula') !== '' ? formData.get('precio_matricula') : null,
    precio_pension: formData.get('precio_pension') !== '' ? formData.get('precio_pension') : null,
    numero_pensiones: formData.get('numero_pensiones') !== '' ? formData.get('numero_pensiones') : null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).maybeSingle();
  if (existing) return { error: 'Ya existe una edición con este código' };

  const { data, error } = await supabase.from('ediciones').insert(parsed.data).select().single();
  if (error) return { error: 'Ocurrió un error al crear la edición' };

  revalidatePath('/oferta/ediciones');
  revalidatePath('/oferta/programas');
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
    precio_matricula: formData.get('precio_matricula') !== '' ? formData.get('precio_matricula') : null,
    precio_pension: formData.get('precio_pension') !== '' ? formData.get('precio_pension') : null,
    numero_pensiones: formData.get('numero_pensiones') !== '' ? formData.get('numero_pensiones') : null,
    dias_reserva: formData.get('dias_reserva') || 7,
    primer_vencimiento: formData.get('primer_vencimiento') || null,
    frecuencia_meses: formData.get('frecuencia_meses') || 1,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = edicionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('ediciones').select('id').eq('codigo', parsed.data.codigo).neq('id', id).maybeSingle();
  if (existing) return { error: 'Ya existe otra edición con este código' };

  const { data, error } = await supabase.from('ediciones').update(parsed.data).eq('id', id).select().single();
  if (error) return { error: 'Ocurrió un error al actualizar la edición' };

  revalidatePath('/oferta/ediciones');
  revalidatePath(`/oferta/ediciones/${id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

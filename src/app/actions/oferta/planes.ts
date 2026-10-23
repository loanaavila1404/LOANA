'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { planEstudioSchema, cicloSchema, cursoSchema } from '@/lib/validators/oferta';

// --- PLANES DE ESTUDIO ---
export async function createPlanAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear planes de estudio' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    version: formData.get('version') || null,
    fecha_vigencia_desde: formData.get('fecha_vigencia_desde') || null,
    fecha_vigencia_hasta: formData.get('fecha_vigencia_hasta') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = planEstudioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .maybeSingle();
  if (existing) return { error: 'Ya existe un plan con este código' };

  const { data, error } = await supabase
    .from('planes_estudio')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { error: `Error al crear el plan de estudio: ${error.message}` };

  revalidatePath(`/oferta/programas/${parsed.data.programa_id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updatePlanAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar planes de estudio' };
  }

  const payload = {
    programa_id: formData.get('programa_id'),
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    version: formData.get('version') || null,
    fecha_vigencia_desde: formData.get('fecha_vigencia_desde') || null,
    fecha_vigencia_hasta: formData.get('fecha_vigencia_hasta') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = planEstudioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .neq('id', id)
    .maybeSingle();
  if (existing) return { error: 'Ya existe otro plan con este código' };

  const { data, error } = await supabase
    .from('planes_estudio')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();
  if (error) return { error: `Error al actualizar el plan: ${error.message}` };

  revalidatePath(`/oferta/programas/${parsed.data.programa_id}`);
  revalidatePath('/oferta/programas');
  return { success: true, data };
}

// --- CICLOS ---
export async function createCicloAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear ciclos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    numero_orden: formData.get('numero_orden'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cicloSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ciclos')
    .select('id')
    .eq('plan_id', parsed.data.plan_id)
    .eq('numero_orden', parsed.data.numero_orden)
    .maybeSingle();
  if (existing) return { error: 'Ya existe un ciclo con este número de orden en el plan' };

  const { data, error } = await supabase
    .from('ciclos')
    .insert({
      plan_id: parsed.data.plan_id,
      numero_orden: parsed.data.numero_orden,
      nombre: parsed.data.nombre || `Ciclo ${parsed.data.numero_orden}`,
      status: parsed.data.status,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) return { error: `Error al crear el ciclo: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

export async function updateCicloAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar ciclos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    numero_orden: formData.get('numero_orden'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cicloSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ciclos')
    .select('id')
    .eq('plan_id', parsed.data.plan_id)
    .eq('numero_orden', parsed.data.numero_orden)
    .neq('id', id)
    .maybeSingle();
  if (existing) return { error: 'Ya existe otro ciclo con este número de orden en el plan' };

  const { data, error } = await supabase
    .from('ciclos')
    .update({
      plan_id: parsed.data.plan_id,
      numero_orden: parsed.data.numero_orden,
      nombre: parsed.data.nombre || `Ciclo ${parsed.data.numero_orden}`,
      status: parsed.data.status,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: `Error al actualizar el ciclo: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

// --- CURSOS ---
export async function createCursoAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear cursos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre'),
    horas_semanales: formData.get('horas_semanales') || null,
    creditos: formData.get('creditos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cursoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cursos')
    .insert({
      ...parsed.data,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) return { error: `Error al crear el curso: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

export async function updateCursoAction(id: string, formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar cursos' };
  }

  const payload = {
    plan_id: formData.get('plan_id'),
    ciclo_id: formData.get('ciclo_id'),
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre'),
    horas_semanales: formData.get('horas_semanales') || null,
    creditos: formData.get('creditos') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = cursoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cursos')
    .update({
      ...parsed.data,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: `Error al actualizar el curso: ${error.message}` };

  const programa = await supabase
    .from('planes_estudio')
    .select('programa_id')
    .eq('id', parsed.data.plan_id)
    .maybeSingle();
  if (programa.data?.programa_id) {
    revalidatePath(`/oferta/programas/${programa.data.programa_id}`);
  }
  revalidatePath('/oferta/programas');

  return { success: true, data };
}

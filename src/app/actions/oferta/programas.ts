'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { programaSchema, ProgramaInput } from '@/lib/validators/oferta';
import { Database } from '@/types/database.types';

type ProgramaRow = Database['public']['Tables']['programas']['Row'];

export type ProgramaActionState = {
  error?: string;
  success?: boolean;
  data?: ProgramaRow;
};

export async function createProgramaAction(
  prevState: ProgramaActionState,
  formData: FormData
): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para crear programas' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    tipo_programa: formData.get('tipo_programa'),
    duracion_cantidad: formData.get('duracion_cantidad') || null,
    duracion_unidad: formData.get('duracion_unidad') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    descripcion: formData.get('descripcion') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = programaSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  
  // Verificación de duplicados manual para no fallar con un error técnico de DB
  const { data: existing } = await supabase
    .from('programas')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .single();

  if (existing) {
    return { error: 'Ya existe un programa con este código' };
  }

  const { data, error } = await supabase
    .from('programas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Error insertando programa:', error);
    return { error: 'Ocurrió un error al crear el programa' };
  }

  // Auto-crear estructura básica (Plan Activo + Ciclo Único) internamente
  try {
    const anio = new Date().getFullYear();
    const codigoBase = `PLAN-${parsed.data.codigo}-${anio}-${Math.floor(Math.random()*1000)}`;
    const { data: planInsertado, error: planError } = await supabase
      .from('planes_estudio')
      .insert({
        programa_id: data.id,
        codigo: codigoBase,
        nombre: `Plan vigente ${anio}`,
        version: '1.0',
        status: 'ACTIVO'
      })
      .select('id')
      .single();

    if (!planError && planInsertado) {
      await supabase.from('ciclos').insert({
        plan_id: planInsertado.id,
        numero_orden: 1,
        codigo: 'CICLO-UNICO',
        nombre: 'Ciclo único',
        status: 'ACTIVO'
      });
    }
  } catch (e) {
    console.error('Error silencioso al crear estructura básica', e);
  }

  revalidatePath('/oferta/programas');
  return { success: true, data };
}

export async function updateProgramaAction(
  id: string,
  prevState: ProgramaActionState,
  formData: FormData
): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para editar programas' };
  }

  const payload = {
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    tipo_programa: formData.get('tipo_programa'),
    duracion_cantidad: formData.get('duracion_cantidad') || null,
    duracion_unidad: formData.get('duracion_unidad') || null,
    total_ciclos: formData.get('total_ciclos') || null,
    descripcion: formData.get('descripcion') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = programaSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verificar código duplicado en OTRO programa
  const { data: existing } = await supabase
    .from('programas')
    .select('id')
    .eq('codigo', parsed.data.codigo)
    .neq('id', id)
    .single();

  if (existing) {
    return { error: 'Ya existe otro programa con este código' };
  }

  const { data, error } = await supabase
    .from('programas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando programa:', error);
    return { error: 'Ocurrió un error al actualizar el programa' };
  }

  revalidatePath('/oferta/programas');
  revalidatePath(`/oferta/programas/${id}`);
  return { success: true, data };
}

export async function toggleProgramaStatusAction(id: string, currentStatus: string): Promise<ProgramaActionState> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para modificar programas' };
  }

  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('programas')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando estado del programa:', error);
    return { error: 'Ocurrió un error al actualizar el estado' };
  }

  revalidatePath('/oferta/programas');
  revalidatePath(`/oferta/programas/${id}`);
  return { success: true, data };
}

export async function createEstructuraBasicaAction(programaId: string): Promise<{error?: string, success?: boolean}> {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para configurar la estructura' };
  }

  const supabase = await createClient();
  
  // Buscar programa
  const { data: programa } = await supabase.from('programas').select('*').eq('id', programaId).single();
  if (!programa) return { error: 'Programa no encontrado' };

  // 1. Buscar o crear Plan Activo
  let planId;
  const { data: existingPlan } = await supabase
    .from('planes_estudio')
    .select('id')
    .eq('programa_id', programaId)
    .eq('status', 'ACTIVO')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingPlan) {
    planId = existingPlan.id;
  } else {
    const anio = new Date().getFullYear();
    const codigoBase = `PLAN-${programa.codigo}-${anio}-${Math.floor(Math.random()*1000)}`;
    const { data: planInsertado, error: planError } = await supabase
      .from('planes_estudio')
      .insert({
        programa_id: programaId,
        codigo: codigoBase,
        nombre: `Plan vigente ${anio}`,
        version: '1.0',
        status: 'ACTIVO'
      })
      .select('id')
      .single();
    
    if (planError) {
      console.error('Error creando plan:', planError);
      return { error: 'Ocurrió un error al crear el plan de estudio' };
    }
    planId = planInsertado.id;
  }

  // 2. Crear "Ciclo único" si no hay ciclos
  const { count } = await supabase
    .from('ciclos')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId);
    
  if (count === 0) {
    await supabase.from('ciclos').insert({
      plan_id: planId,
      numero_orden: 1,
      codigo: 'CICLO-UNICO',
      nombre: 'Ciclo único',
      status: 'ACTIVO'
    });
  }

  revalidatePath(`/oferta/programas/${programaId}`);
  return { success: true };
}

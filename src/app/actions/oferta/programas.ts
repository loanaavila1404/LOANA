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

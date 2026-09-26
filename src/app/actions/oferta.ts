'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionState, success, error } from '@/lib/utils/actions';
import { revalidatePath } from 'next/cache';
import { programaSchema, edicionSchema, } from '@/lib/validators/oferta';
import { Database } from '@/types/database.types';

export async function createPrograma(prevState: ActionState<unknown> | null, formData: FormData): Promise<ActionState<unknown>> {
  const supabase = await createClient();
  
  const rawData = Object.fromEntries(formData.entries());
  const parsed = programaSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return error('Error de validación', parsed.error.flatten().fieldErrors);
  }

  const { error: dbError } = await supabase
    .from('programas')
    .insert([parsed.data]);

  if (dbError) {
    console.error('Error creating programa:', dbError);
    return error('No se pudo crear el programa. Inténtelo de nuevo.');
  }

  revalidatePath('/oferta');
  return success('Programa creado exitosamente');
}

export async function createEdicion(prevState: ActionState<unknown> | null, formData: FormData): Promise<ActionState<unknown>> {
  const supabase = await createClient();
  
  const rawData = Object.fromEntries(formData.entries());
  const parsed = edicionSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return error('Error de validación', parsed.error.flatten().fieldErrors);
  }

  // Sanitize empty strings to null for UUID fields or dates
  const insertData = { ...parsed.data };
  if (!insertData.programa_id) insertData.programa_id = undefined;
  if (!insertData.plan_id) insertData.plan_id = undefined;
  if (!insertData.ciclo_id) insertData.ciclo_id = undefined;
  if (!insertData.periodo_id) insertData.periodo_id = undefined;
  if (!insertData.fecha_inicio) insertData.fecha_inicio = undefined;
  if (!insertData.fecha_fin) insertData.fecha_fin = undefined;
  if (!insertData.primer_vencimiento) insertData.primer_vencimiento = undefined;

  const { error: dbError } = await supabase
    .from('ediciones')
    .insert([insertData as Database['public']['Tables']['ediciones']['Insert']]);

  if (dbError) {
    console.error('Error creating edicion:', dbError);
    return error('No se pudo crear la edición. Inténtelo de nuevo.');
  }

  revalidatePath('/oferta');
  return success('Edición creada exitosamente');
}

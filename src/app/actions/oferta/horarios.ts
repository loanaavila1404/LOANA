'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';
import { horarioSchema } from '@/lib/validators/oferta';

export async function createHorarioAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR') && !permissions.includes('ACADEMICO.GESTIONAR')) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('roles(code)').eq('id', user.id).maybeSingle();
      const code = (profile?.roles as unknown as { code: string })?.code?.toUpperCase();
      if (!['SUPERADMIN', 'SUPER_ADMINISTRADOR', 'ADMINISTRACION', 'ADMINISTRADOR', 'DIRECCION'].includes(code || '')) {
        return { error: 'No tienes permiso para crear horarios' };
      }
    }
  }

  let horaInicio = (formData.get('hora_inicio') as string) || '';
  let horaFin = (formData.get('hora_fin') as string) || '';

  if (horaInicio && horaInicio.length === 5) horaInicio += ':00';
  if (horaFin && horaFin.length === 5) horaFin += ':00';

  const payload = {
    edicion_id: formData.get('edicion_id'),
    curso_id: formData.get('curso_id'),
    dia_semana: formData.get('dia_semana'),
    hora_inicio: (formData.get('hora_inicio') as string) || '',
    hora_fin: (formData.get('hora_fin') as string) || '',
    ubicacion: formData.get('ubicacion') || null,
    docente: formData.get('docente') || null,
    observaciones: formData.get('observaciones') || null,
    status: formData.get('status') || 'ACTIVO',
  };

  const parsed = horarioSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('horarios').insert({
    ...parsed.data,
    hora_inicio: horaInicio || parsed.data.hora_inicio,
    hora_fin: horaFin || parsed.data.hora_fin,
    created_by: userData?.user?.id || null
  }).select(`
    id,
    edicion_id,
    curso_id,
    dia_semana,
    hora_inicio,
    hora_fin,
    ubicacion,
    docente,
    observaciones,
    status,
    cursos (id, codigo, nombre, creditos, horas_semanales)
  `).single();
  
  if (error) {
    console.error('Error al crear horario:', error);
    return { error: `Ocurrió un error al crear el horario: ${error.message}` };
  }

  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}`);
  revalidatePath(`/oferta/ediciones/${parsed.data.edicion_id}/ficha`);
  revalidatePath('/oferta/programas');
  revalidatePath('/horarios');
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
  revalidatePath('/horarios');
  return { success: true, data };
}

export async function deleteHorarioAction(id: string, edicionId: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('PROGRAMAS.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR') && !permissions.includes('ACADEMICO.GESTIONAR')) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('roles(code)').eq('id', user.id).maybeSingle();
      const code = (profile?.roles as unknown as { code: string })?.code?.toUpperCase();
      if (!['SUPERADMIN', 'SUPER_ADMINISTRADOR', 'ADMINISTRACION', 'ADMINISTRADOR', 'DIRECCION'].includes(code || '')) {
        return { error: 'No tienes permiso para eliminar horarios' };
      }
    }
  }

  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  // 1. Obtener snapshot del horario antes de eliminar
  const { data: horarioData } = await db
    .from('horarios')
    .select(`
      id,
      edicion_id,
      curso_id,
      dia_semana,
      hora_inicio,
      hora_fin,
      docente,
      ubicacion,
      status,
      cursos (codigo, nombre),
      ediciones (codigo, nombre)
    `)
    .eq('id', id)
    .single();

  // 2. Registrar en la bitácora institucional (audit_logs)
  if (horarioData) {
    try {
      const cursoNombre = Array.isArray(horarioData.cursos)
        ? horarioData.cursos[0]?.nombre
        : (horarioData.cursos as { nombre?: string } | null)?.nombre || 'Asignatura';
      const dia = horarioData.dia_semana || 'Día';
      const hIni = (horarioData.hora_inicio || '').slice(0, 5);
      const hFin = (horarioData.hora_fin || '').slice(0, 5);

      await db.from('audit_logs').insert({
        user_id: authCtx?.userId || null,
        user_role: authCtx?.roleName || authCtx?.roleCode || 'ADMINISTRACION',
        action: 'DELETE',
        module: 'HORARIOS',
        entity: 'horarios',
        entity_id: id,
        detail: `Eliminación de bloque horario: ${cursoNombre} (${dia} ${hIni}-${hFin}) en edición ${horarioData.edicion_id}`,
        data_before: horarioData,
        data_after: { status: 'ELIMINADO' },
        result: 'EXITO',
      });
    } catch (auditErr) {
      console.error('Error al registrar auditoría de borrado de horario:', auditErr);
    }
  }

  // 3. Eliminar registro
  const { error } = await db.from('horarios').delete().eq('id', id);
  if (error) {
    return { error: `Error al eliminar horario: ${error.message}` };
  }

  if (edicionId) {
    revalidatePath(`/oferta/ediciones/${edicionId}`);
    revalidatePath(`/oferta/ediciones/${edicionId}/ficha`);
  }
  revalidatePath('/oferta/programas');
  revalidatePath('/horarios');
  revalidatePath('/auditoria');
  return { success: true };
}

export async function logSemanaAuditAction(
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  semanaData: {
    id: string;
    label: string;
    rango: string;
    estado?: string;
    edicionId?: string;
  }
) {
  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();

  try {
    await db.from('audit_logs').insert({
      user_id: authCtx?.userId || null,
      user_role: authCtx?.roleName || authCtx?.roleCode || 'ADMINISTRACION',
      action: action === 'DELETE' ? 'DELETE' : action === 'INSERT' ? 'INSERT' : 'UPDATE',
      module: 'HORARIOS',
      entity: 'semanas_cronograma',
      entity_id: semanaData.id,
      detail: `${action === 'DELETE' ? 'Eliminación' : action === 'INSERT' ? 'Creación' : 'Modificación'} de semana académica: "${semanaData.label}" (${semanaData.rango})`,
      data_before: action === 'DELETE' ? semanaData : null,
      data_after: action !== 'DELETE' ? semanaData : { status: 'ELIMINADO' },
      result: 'EXITO',
    });
    revalidatePath('/horarios');
    revalidatePath('/auditoria');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error al registrar auditoría de semana:', err);
    return { success: false };
  }
}


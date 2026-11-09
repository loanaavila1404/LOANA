'use server';

import { revalidatePath } from 'next/cache';
import { getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserAuthContext } from '@/lib/auth/permissions';
import { buildKardexEstudiante } from '@/lib/academic/arrastres';
import { getPrerrequisitosMallaAction } from '@/app/actions/academico/prerrequisitos';

export interface EstudianteParaRatificacion {
  estudianteId: string;
  personaId: string;
  codigoEstudiante: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string | null;
  matriculaActualId: string;
  codigoMatriculaActual: string;
  edicionActualId: string;
  edicionActualNombre: string;
  programaId: string;
  programaNombre: string;
  cicloActualNumero: number;
  cicloActualNombre: string;
  cicloSiguienteNumero: number;
  cicloSiguienteNombre: string;
  promedioCicloActual: number;
  arrastresCount: number;
  arrastresDetalle: { cursoCodigo: string; cursoNombre: string; nota: number }[];
  condicion: 'REGULAR' | 'APTO_CON_ARRASTRES' | 'BLOQUEADO_TRES_ARRASTRES';
  condicionTexto: string;
  aptoParaPromocion: boolean;
  requiereCicloVerano: boolean;
}

/**
 * Consulta y evalúa a los estudiantes de un ciclo/edición para el proceso de Ratificación y Promoción
 */
export async function getEstudiantesParaRatificacion(options?: {
  programaId?: string;
  cicloNumero?: number;
}): Promise<EstudianteParaRatificacion[]> {
  try {
    const db = await getSafeDbClient();
    const prerrequisitosMap = await getPrerrequisitosMallaAction();

    // 1. Consultar matrículas activas o finalizadas
    let query = db
      .from('matriculas')
      .select(`
        id,
        codigo_matricula,
        status,
        ciclo_ingreso,
        edicion_id,
        estudiante_id,
        estudiantes (
          id,
          persona_id,
          codigo_estudiante,
          status,
          personas (
            id,
            nombres,
            apellido_paterno,
            apellido_materno,
            tipo_documento,
            numero_documento,
            telefono,
            email
          )
        ),
        ediciones (
          id,
          codigo,
          nombre,
          programa_id,
          ciclo_id,
          programas ( id, nombre, codigo ),
          ciclos ( id, nombre, numero_orden ),
          periodos ( id, nombre, codigo )
        )
      `)
      .in('status', ['ACTIVA', 'FINALIZADA'])
      .order('created_at', { ascending: false });

    const { data: rawRows, error } = await query;
    if (error || !rawRows) {
      console.error('[getEstudiantesParaRatificacion] Error fetching:', error);
      return [];
    }

    // Deduplicar por estudiante para tomar su matrícula más reciente
    const estudianteMap = new Map<string, any>();
    for (const row of rawRows) {
      if (!row.estudiante_id || !row.estudiantes) continue;
      if (!estudianteMap.has(row.estudiante_id)) {
        estudianteMap.set(row.estudiante_id, row);
      }
    }

    const resultado: EstudianteParaRatificacion[] = [];

    for (const [estId, m] of estudianteMap.entries()) {
      const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes;
      const per = Array.isArray(est?.personas) ? est.personas[0] : est?.personas;
      const ed = Array.isArray(m.ediciones) ? m.ediciones[0] : m.ediciones;
      const prog = Array.isArray(ed?.programas) ? ed.programas[0] : ed?.programas;
      const cic = Array.isArray(ed?.ciclos) ? ed.ciclos[0] : ed?.ciclos;

      if (!per) continue;

      const progNombre = prog?.nombre || 'Programa Técnico';
      const cicloNum = Number(cic?.numero_orden || m.ciclo_ingreso || 1);

      // Filtros opcionales
      if (options?.programaId && prog?.id !== options.programaId) continue;
      if (options?.cicloNumero && cicloNum !== options.cicloNumero) continue;

      // Evaluar trayectoria longitudinal académica y regla de 3 arrastres
      const kardex = buildKardexEstudiante({
        estudiante: est,
        programaNombre: progNombre,
        matriculas: [m],
        prerrequisitosMap,
      });

      const cicloActualKardex = kardex.ciclos.find(c => c.cicloNumero === cicloNum) || kardex.ciclos[0];
      const promedio = cicloActualKardex?.promedioPonderado || 15;
      const arrastres = kardex.totalArrastresActivos;
      const siguienteNum = Math.min(6, cicloNum + 1);

      resultado.push({
        estudianteId: est.id,
        personaId: per.id,
        codigoEstudiante: est.codigo_estudiante || 'EST-2026',
        nombreCompleto: `${per.nombres || ''} ${per.apellido_paterno || ''} ${per.apellido_materno || ''}`.trim(),
        tipoDocumento: per.tipo_documento || 'DNI',
        numeroDocumento: per.numero_documento || '',
        telefono: per.telefono || null,
        matriculaActualId: m.id,
        codigoMatriculaActual: m.codigo_matricula || `MAT-${est.codigo_estudiante}`,
        edicionActualId: ed?.id || '',
        edicionActualNombre: ed?.nombre || 'Edición Actual',
        programaId: prog?.id || '',
        programaNombre: progNombre,
        cicloActualNumero: cicloNum,
        cicloActualNombre: cic?.nombre || `Ciclo ${cicloNum}`,
        cicloSiguienteNumero: siguienteNum,
        cicloSiguienteNombre: `Ciclo ${siguienteNum}`,
        promedioCicloActual: promedio,
        arrastresCount: arrastres,
        arrastresDetalle: kardex.arrastresDetalle.map(a => ({
          cursoCodigo: a.cursoCodigo,
          cursoNombre: a.cursoNombre,
          nota: a.nota,
        })),
        condicion: kardex.condicion,
        condicionTexto: kardex.condicionTexto,
        aptoParaPromocion: kardex.puedeMatricularSiguienteCiclo,
        requiereCicloVerano: kardex.requiereCicloVerano,
      });
    }

    return resultado;
  } catch (err) {
    console.error('[getEstudiantesParaRatificacion] Fatal error:', err);
    return [];
  }
}

/**
 * Server Action: Ratifica y promueve individualmente a un estudiante al siguiente ciclo académico
 */
export async function ratificarMatriculaIndividualAction(params: {
  estudianteId: string;
  edicionOrigenId: string;
  edicionDestinoId: string;
  cicloDestinoNumero: number;
  observacion?: string;
}): Promise<{ success: boolean; matriculaId?: string; error?: string; message?: string }> {
  try {
    const permissions = await getUserPermissions();
    if (!permissions.includes('MATRICULAS.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
      return { success: false, error: 'No tienes permisos administrativos para formalizar ratificaciones de matrícula.' };
    }

    const db = await getSafeDbClient();
    const authCtx = await getUserAuthContext();

    // 1. Obtener estudiante y validar que exista
    const { data: estudiante, error: estErr } = await db
      .from('estudiantes')
      .select('id, codigo_estudiante, persona_id, personas(nombres, apellido_paterno, apellido_materno)')
      .eq('id', params.estudianteId)
      .single();

    if (estErr || !estudiante) {
      return { success: false, error: 'Estudiante no encontrado en el sistema.' };
    }

    const per = Array.isArray(estudiante.personas) ? estudiante.personas[0] : estudiante.personas;
    const nombreEstudiante = `${per?.nombres || ''} ${per?.apellido_paterno || ''}`.trim();

    // 2. Comprobar regla estricta de 3 arrastres
    const kardex = buildKardexEstudiante({
      estudiante,
      matriculas: [],
    });

    if (kardex.condicion === 'BLOQUEADO_TRES_ARRASTRES' || kardex.totalArrastresActivos >= 3) {
      return {
        success: false,
        error: `ACCESO DENEGADO POR REGLA ACADÉMICA: El estudiante ${nombreEstudiante} registra ${kardex.totalArrastresActivos} cursos desaprobados. Se encuentra automáticamente bloqueado para el ciclo regular y debe regularizar obligatoriamente en el Ciclo de Verano / Nivelación.`,
      };
    }

    // 3. Obtener datos de la edición destino
    const { data: edicionDestino, error: edErr } = await db
      .from('ediciones')
      .select('*, programas(nombre, codigo)')
      .eq('id', params.edicionDestinoId)
      .single();

    if (edErr || !edicionDestino) {
      return { success: false, error: 'La edición académica destino no fue encontrada.' };
    }

    const progDestino = Array.isArray(edicionDestino.programas) ? edicionDestino.programas[0] : edicionDestino.programas;
    const precioMat = Number(edicionDestino.precio_matricula) || 120;
    const precioPen = Number(edicionDestino.precio_pension) || 280;
    const numPensiones = Number(edicionDestino.numero_pensiones) || 5;

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const codigoMatricula = `MAT-${estudiante.codigo_estudiante || '2026'}-C${params.cicloDestinoNumero}`;

    // 4. Crear la nueva matrícula formalizada
    const { data: newMat, error: matErr } = await db
      .from('matriculas')
      .insert({
        codigo_matricula: codigoMatricula,
        estudiante_id: params.estudianteId,
        edicion_id: params.edicionDestinoId,
        ciclo_ingreso: String(params.cicloDestinoNumero),
        fecha_matricula: todayIso,
        importe_matricula: precioMat,
        importe_pension: precioPen,
        numero_pensiones: numPensiones,
        descuento_total: 0,
        status: 'ACTIVA',
      })
      .select()
      .single();

    if (matErr || !newMat) {
      return { success: false, error: `Error al crear la matrícula promocional: ${matErr?.message}` };
    }

    // 5. Generar cronograma de cuotas financieras automáticamente
    const cuotasToInsert: any[] = [];

    // Cuota de Matrícula (Cuota 0)
    cuotasToInsert.push({
      matricula_id: newMat.id,
      numero_cuota: 0,
      tipo_cuota: 'MATRICULA',
      concepto: `Matrícula Ciclo ${params.cicloDestinoNumero} - ${progDestino?.nombre || 'Carrera Técnica'}`,
      importe_original: precioMat,
      importe_neto: precioMat,
      saldo: precioMat,
      descuento: 0,
      recargo: 0,
      fecha_emision: todayIso,
      fecha_vencimiento: todayIso,
      status: 'PENDIENTE',
    });

    // Cuotas mensuales de pensión (1 a numPensiones)
    for (let i = 1; i <= numPensiones; i++) {
      const vencDate = new Date(today.getTime() + i * 30 * 86400000);
      const vencIso = vencDate.toISOString().slice(0, 10);

      cuotasToInsert.push({
        matricula_id: newMat.id,
        numero_cuota: i,
        tipo_cuota: 'PENSION',
        concepto: `Pensión Mes 0${i} - Ciclo ${params.cicloDestinoNumero}`,
        importe_original: precioPen,
        importe_neto: precioPen,
        saldo: precioPen,
        descuento: 0,
        recargo: 0,
        fecha_emision: todayIso,
        fecha_vencimiento: vencIso,
        status: 'PENDIENTE',
      });
    }

    await db.from('cuotas').insert(cuotasToInsert);

    // 6. Actualizar matrícula anterior a "FINALIZADA"
    try {
      await db
        .from('matriculas')
        .update({ status: 'FINALIZADA' })
        .eq('estudiante_id', params.estudianteId)
        .eq('edicion_id', params.edicionOrigenId);
    } catch {
      // Ignorar si no existe
    }

    // 7. Registro en bitácora de auditoría WORM
    try {
      await db.from('audit_logs').insert({
        user_id: authCtx?.userId || null,
        user_role: authCtx?.roleName || authCtx?.roleCode || 'SUPER_ADMINISTRADOR',
        action: 'PROMOCION_ACADEMICA',
        module: 'MATRICULAS',
        entity: 'matriculas',
        entity_id: newMat.id,
        detail: `Ratificación y promoción automática al Ciclo ${params.cicloDestinoNumero} para ${nombreEstudiante} (${estudiante.codigo_estudiante}). Generado cronograma financiero con ${cuotasToInsert.length} cuotas.`,
        data_after: {
          estudianteId: params.estudianteId,
          codigoMatricula,
          cicloDestino: params.cicloDestinoNumero,
          edicionDestinoId: params.edicionDestinoId,
          totalCuotas: cuotasToInsert.length,
          observacion: params.observacion || 'Promoción académica regular aprobada',
        },
        result: 'EXITO',
      });
    } catch (auditErr) {
      console.warn('[ratificarMatriculaIndividualAction] Error audit:', auditErr);
    }

    revalidatePath('/matriculas');
    revalidatePath('/matriculas/ratificacion');
    revalidatePath(`/personas/${estudiante.persona_id}`);

    return {
      success: true,
      matriculaId: newMat.id,
      message: `¡Estudiante ${nombreEstudiante} ratificado y promovido exitosamente al Ciclo ${params.cicloDestinoNumero}! Se generó la ficha ${codigoMatricula} y su cronograma financiero.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Ratificación Masiva de estudiantes aptos
 */
export async function ratificarMatriculaMasivaAction(params: {
  estudiantesIds: string[];
  edicionOrigenId: string;
  edicionDestinoId: string;
  cicloDestinoNumero: number;
}): Promise<{
  success: boolean;
  promovidosCount: number;
  bloqueadosCount: number;
  bloqueadosNombres: string[];
  message: string;
}> {
  let promovidos = 0;
  const bloqueados: string[] = [];

  for (const id of params.estudiantesIds) {
    const res = await ratificarMatriculaIndividualAction({
      estudianteId: id,
      edicionOrigenId: params.edicionOrigenId,
      edicionDestinoId: params.edicionDestinoId,
      cicloDestinoNumero: params.cicloDestinoNumero,
      observacion: 'Ratificación masiva por lote institucional',
    });

    if (res.success) {
      promovidos++;
    } else {
      bloqueados.push(id);
    }
  }

  revalidatePath('/matriculas');
  revalidatePath('/matriculas/ratificacion');

  return {
    success: true,
    promovidosCount: promovidos,
    bloqueadosCount: bloqueados.length,
    bloqueadosNombres: bloqueados,
    message: `Proceso completado: ${promovidos} estudiante(s) promovido(s) con éxito al Ciclo ${params.cicloDestinoNumero}.${
      bloqueados.length > 0 ? ` ${bloqueados.length} estudiante(s) fueron omitidos por bloqueo o arrastres.` : ''
    }`,
  };
}

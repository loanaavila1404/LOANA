'use server'

import { revalidatePath } from 'next/cache';
import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { getUserPermissions, isCurrentUserAdvisor, getUserAuthContext } from '@/lib/auth/permissions';
import { confirmarMatriculaSchema, registrarPagoSchema } from '@/lib/validators/matriculas';

export async function confirmarMatriculaAction(payload: unknown) {
  // Validación estricta por rol: Asesor Comercial está bloqueado de crear/confirmar matrículas
  const isAdvisor = await isCurrentUserAdvisor();
  if (isAdvisor) {
    return { error: 'Acceso denegado: El rol Asesor Comercial tiene permisos estrictamente de solo lectura en el módulo de matrículas.' };
  }

  const permissions = await getUserPermissions();
  if (!permissions.includes('MATRICULAS.GESTIONAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para gestionar matrículas.' };
  }

  const parsed = confirmarMatriculaSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // @ts-ignore: rpc types not updated yet
  const { data, error } = await supabase.rpc('confirmar_matricula_atomica', {
    p_estudiante_id: parsed.data.estudiante_id,
    p_edicion_id: parsed.data.edicion_id,
    p_ciclo_id: parsed.data.ciclo_id || null,
    p_prospecto_id: parsed.data.prospecto_id || null,
    p_asesor_id: parsed.data.asesor_id || null,
    p_importe_matricula: parsed.data.importe_matricula,
    p_importe_pension: parsed.data.importe_pension,
    p_numero_pensiones: parsed.data.numero_pensiones,
    p_descuento_total: parsed.data.descuento_total,
    p_descuento_motivo: parsed.data.descuento_motivo || null,
    p_primer_vencimiento: parsed.data.primer_vencimiento,
    p_frecuencia_meses: parsed.data.frecuencia_meses
  });

  if (error) {
    return { error: error.message || 'Error al confirmar la matrícula.' };
  }

  revalidatePath('/matriculas');
  return { success: true, matricula_id: data };
}

export async function registrarPagoAction(payload: unknown) {
  // Validación estricta por rol: Asesor Comercial no puede registrar pagos
  const isAdvisor = await isCurrentUserAdvisor();
  if (isAdvisor) {
    return { error: 'Acceso denegado: El rol Asesor Comercial no tiene autorización para registrar pagos o abonos.' };
  }

  const permissions = await getUserPermissions();
  if (
    !permissions.includes('PAGOS.REGISTRAR') &&
    !permissions.includes('SISTEMA.ADMINISTRAR') &&
    !permissions.includes('COBRANZA.VER')
  ) {
    return { error: 'No tienes permiso para registrar pagos.' };
  }

  const parsed = registrarPagoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // @ts-ignore: rpc types not updated yet
  const { data, error } = await supabase.rpc('registrar_pago_atomico', {
    p_idempotency_key: parsed.data.idempotency_key,
    p_estudiante_id: parsed.data.estudiante_id,
    p_importe: parsed.data.importe,
    p_medio_pago: parsed.data.medio_pago,
    p_numero_operacion: parsed.data.numero_operacion || null,
    p_comprobante_tipo: parsed.data.comprobante_tipo || null,
    p_comprobante_numero: parsed.data.comprobante_numero || null,
    p_observaciones: parsed.data.observaciones || null,
    p_cuotas_aplicadas: parsed.data.cuotas_aplicadas
  });

  if (error) {
    return { error: error.message || 'Error al registrar el pago.' };
  }

  revalidatePath('/matriculas');
  return { success: true, pago_id: data as unknown as string };
}

export async function anularPagoAction(pagoId: string, motivo: string) {
  // Validación estricta por rol: Asesor Comercial no puede anular pagos
  const isAdvisor = await isCurrentUserAdvisor();
  if (isAdvisor) {
    return { error: 'Acceso denegado: El rol Asesor Comercial no tiene autorización para anular pagos.' };
  }

  const permissions = await getUserPermissions();
  if (!permissions.includes('PAGOS.ANULAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No tienes permiso para anular pagos.' };
  }

  const supabase = await createClient();

  // @ts-ignore
  const { error } = await supabase.rpc('anular_pago_atomico', {
    p_pago_id: pagoId,
    p_motivo: motivo
  });

  if (error) return { error: error.message || 'Error al anular el pago.' };

  revalidatePath('/matriculas');
  return { success: true };
}

export interface ValidarPagoMatriculaInput {
  matriculaId: string;
  tipoPago: 'MATRICULA' | 'TOTAL' | 'PARCIAL';
  montoPersonalizado?: number;
  medioPago: string;
  numeroOperacion?: string;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  observaciones?: string;
}

export async function validarPagoMatriculaAction(input: ValidarPagoMatriculaInput) {
  const authCtx = await getUserAuthContext();
  if (!authCtx) {
    return { error: 'Usuario no autenticado.' };
  }

  // Protección estricta: Asesores comerciales tienen prohibido validar pagos o aprobar matrículas
  if (authCtx.isAsesor) {
    return {
      error: 'Acceso denegado: Los Asesores Comerciales tienen permisos estrictamente de solo lectura y no pueden validar pagos ni aprobar matrículas.',
    };
  }

  const perms = authCtx.permissions;
  if (
    !perms.includes('MATRICULAS.GESTIONAR') &&
    !perms.includes('PAGOS.REGISTRAR') &&
    !perms.includes('SISTEMA.ADMINISTRAR')
  ) {
    return { error: 'No cuentas con los permisos requeridos para validar pagos o aprobar matrículas.' };
  }

  const db = await getSafeDbClient();

  // 1. Obtener expediente de la matrícula
  const { data: mat, error: matErr } = await db
    .from('matriculas')
    .select(`
      *,
      estudiantes (
        id,
        persona_id,
        codigo_estudiante,
        fecha_ingreso,
        status,
        personas (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          numero_documento
        )
      )
    `)
    .eq('id', input.matriculaId)
    .single();

  if (matErr || !mat) {
    return { error: 'No se encontró el registro de la matrícula indicada.' };
  }

  const today = new Date().toISOString().split('T')[0];

  // 2. Verificar cuotas existentes o generarlas de forma consistente
  const { data: cuotasRaw } = await db
    .from('cuotas')
    .select('*')
    .eq('matricula_id', mat.id)
    .order('numero_cuota', { ascending: true });

  let cuotasList = cuotasRaw || [];

  if (cuotasList.length === 0) {
    const impMatricula = Number(mat.importe_matricula) || 0;
    const impPension = Number(mat.importe_pension) || 0;
    const numPensiones = Number(mat.numero_pensiones) || 0;
    const descTotal = Number(mat.descuento_total) || 0;
    const freqMeses = Number(mat.frecuencia_meses) || 1;
    const totalBruto = impMatricula + (impPension * numPensiones);

    let descRestante = descTotal;
    let brutoRestante = totalBruto;
    const cuotasNuevas: {
      matricula_id: string;
      tipo_cuota: string;
      numero_cuota: number;
      concepto: string;
      fecha_emision: string;
      fecha_vencimiento: string;
      importe_original: number;
      descuento: number;
      importe_neto: number;
      saldo: number;
      status: string;
    }[] = [];

    // Cuota de Matrícula (cuota 0)
    if (impMatricula > 0 || numPensiones === 0) {
      let descCuota = 0;
      if (numPensiones === 0) {
        descCuota = Math.min(impMatricula, descRestante);
      } else if (brutoRestante > 0) {
        descCuota = Math.min(impMatricula, Math.floor(((impMatricula / brutoRestante) * descRestante) * 100) / 100);
      }
      const neto = Math.max(0, impMatricula - descCuota);
      descRestante = Math.max(0, descRestante - descCuota);
      brutoRestante = Math.max(0, brutoRestante - impMatricula);

      cuotasNuevas.push({
        matricula_id: mat.id,
        tipo_cuota: 'MATRICULA',
        numero_cuota: 0,
        concepto: 'Matrícula',
        fecha_emision: today,
        fecha_vencimiento: mat.primer_vencimiento || today,
        importe_original: impMatricula,
        descuento: descCuota,
        importe_neto: neto,
        saldo: neto,
        status: neto === 0 ? 'PAGADA' : 'PENDIENTE',
      });
    }

    // Cuotas de Pensión (1..N)
    const vtoBase = mat.primer_vencimiento ? new Date(mat.primer_vencimiento + 'T00:00:00') : new Date();
    if (!mat.primer_vencimiento) {
      vtoBase.setDate(vtoBase.getDate() + 30);
    }

    for (let i = 1; i <= numPensiones; i++) {
      let descCuota = 0;
      if (i === numPensiones) {
        descCuota = Math.min(impPension, descRestante);
      } else if (brutoRestante > 0) {
        descCuota = Math.min(impPension, Math.floor(((impPension / brutoRestante) * descRestante) * 100) / 100);
      }
      const neto = Math.max(0, impPension - descCuota);
      descRestante = Math.max(0, descRestante - descCuota);
      brutoRestante = Math.max(0, brutoRestante - impPension);

      const vtoStr = vtoBase.toISOString().split('T')[0];
      cuotasNuevas.push({
        matricula_id: mat.id,
        tipo_cuota: 'PENSION',
        numero_cuota: i,
        concepto: `Pensión ${i}`,
        fecha_emision: today,
        fecha_vencimiento: vtoStr,
        importe_original: impPension,
        descuento: descCuota,
        importe_neto: neto,
        saldo: neto,
        status: neto === 0 ? 'PAGADA' : 'PENDIENTE',
      });

      vtoBase.setMonth(vtoBase.getMonth() + freqMeses);
    }

    if (cuotasNuevas.length > 0) {
      const { data: inserted, error: insCuotasErr } = await db
        .from('cuotas')
        .insert(cuotasNuevas)
        .select('*');

      if (insCuotasErr) {
        return { error: 'Error al generar el cronograma de cuotas: ' + insCuotasErr.message };
      }
      cuotasList = inserted || [];
    }
  }

  // 3. Determinar importe a pagar según la modalidad elegida
  let importeAPagar = 0;
  if (input.tipoPago === 'TOTAL') {
    importeAPagar = cuotasList.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
  } else if (input.tipoPago === 'MATRICULA') {
    const cuotaMat = cuotasList.find(c => c.tipo_cuota === 'MATRICULA') || cuotasList[0];
    importeAPagar = cuotaMat ? (Number(cuotaMat.saldo) || Number(cuotaMat.importe_neto) || 0) : (Number(mat.importe_matricula) || 0);
  } else if (input.tipoPago === 'PARCIAL') {
    importeAPagar = Number(input.montoPersonalizado) || 0;
  }

  if (importeAPagar <= 0 && cuotasList.some(c => (Number(c.saldo) || 0) > 0)) {
    return { error: 'El importe a validar debe ser un monto positivo en soles.' };
  }

  // 4. Aplicar el pago a las cuotas en orden prioritario (Matrícula -> Pensión 1 -> Pensión N)
  let restante = importeAPagar;
  const aplicaciones: { cuota_id: string; importe_aplicado: number }[] = [];

  const cuotasOrdenadas = [...cuotasList].sort((a, b) => {
    if (a.tipo_cuota === 'MATRICULA' && b.tipo_cuota !== 'MATRICULA') return -1;
    if (b.tipo_cuota === 'MATRICULA' && a.tipo_cuota !== 'MATRICULA') return 1;
    return (a.numero_cuota || 0) - (b.numero_cuota || 0);
  });

  for (const c of cuotasOrdenadas) {
    if (restante <= 0) break;
    const saldoActual = Number(c.saldo) || 0;
    if (saldoActual <= 0) continue;

    const montoAplicar = Math.min(saldoActual, restante);
    const nuevoSaldo = Number((saldoActual - montoAplicar).toFixed(2));
    const nuevoStatus = nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL';

    aplicaciones.push({
      cuota_id: c.id,
      importe_aplicado: Number(montoAplicar.toFixed(2)),
    });

    await db
      .from('cuotas')
      .update({
        saldo: nuevoSaldo,
        status: nuevoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', c.id);

    restante = Number((restante - montoAplicar).toFixed(2));
  }

  // 5. Registrar el pago institucional y sus aplicaciones
  if (importeAPagar > 0) {
    const { data: nuevoPago, error: pagoErr } = await db
      .from('pagos')
      .insert({
        estudiante_id: mat.estudiante_id,
        fecha_pago: today,
        importe: importeAPagar,
        medio_pago: input.medioPago || 'TRANSFERENCIA',
        numero_operacion: input.numeroOperacion?.trim() || null,
        comprobante_tipo: input.comprobanteTipo || 'RECIBO',
        comprobante_numero: input.comprobanteNumero?.trim() || null,
        observaciones: (input.observaciones || 'Validación de pago inicial y aprobación de matrícula').trim(),
        status: 'REGISTRADO',
        registrado_por: authCtx.userId,
      })
      .select('id')
      .single();

    if (!pagoErr && nuevoPago) {
      for (const app of aplicaciones) {
        await db.from('pago_aplicaciones').insert({
          pago_id: nuevoPago.id,
          cuota_id: app.cuota_id,
          importe_aplicado: app.importe_aplicado,
          created_by: authCtx.userId,
        });
      }
    }
  }

  // 6. Asignar código oficial si era PRE- y pasar matrícula a ACTIVA
  let nuevoCodigoMat = mat.codigo_matricula;
  if (!nuevoCodigoMat || nuevoCodigoMat.startsWith('PRE-')) {
    const anio = new Date().getFullYear();
    const { count } = await db
      .from('matriculas')
      .select('id', { count: 'exact' });
    const num = (count || 0) + 1;
    nuevoCodigoMat = `MAT-${anio}-${num.toString().padStart(5, '0')}`;
  }

  const { error: updMatErr } = await db
    .from('matriculas')
    .update({
      status: 'ACTIVA',
      codigo_matricula: nuevoCodigoMat,
      fecha_matricula: mat.fecha_matricula || today,
      activada_en: new Date().toISOString(),
      cuotas_generadas_en: new Date().toISOString(),
      updated_by: authCtx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mat.id);

  if (updMatErr) {
    return { error: 'Error al cambiar estado de la matrícula a ACTIVA: ' + updMatErr.message };
  }

  // 7. Activar formalmente al estudiante en el Padrón Institucional
  const est = Array.isArray(mat.estudiantes) ? mat.estudiantes[0] : mat.estudiantes;
  let codigoEst = est?.codigo_estudiante;
  if (!codigoEst) {
    const anio = new Date().getFullYear();
    const { count: countEst } = await db
      .from('estudiantes')
      .select('id', { count: 'exact' });
    const numEst = (countEst || 0) + 1;
    codigoEst = `BRU-${anio}-${numEst.toString().padStart(5, '0')}`;
  }

  await db
    .from('estudiantes')
    .update({
      status: 'ACTIVO',
      codigo_estudiante: codigoEst,
      fecha_ingreso: est?.fecha_ingreso || today,
      updated_by: authCtx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mat.estudiante_id);

  // 8. Si proviene de prospecto CRM, sincronizar a MATRICULADO
  if (mat.prospecto_id) {
    await db
      .from('prospectos')
      .update({
        status: 'MATRICULADO',
        matricula_id: mat.id,
        updated_by: authCtx.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mat.prospecto_id);

    await db.from('seguimientos').insert({
      prospecto_id: mat.prospecto_id,
      tipo_actividad: 'NOTA_INTERNA',
      resultado: 'Matrícula Validada y Activada en Caja',
      nota: `Pago verificado por S/ ${importeAPagar} (${input.medioPago}). Matrícula formalizada con código ${nuevoCodigoMat} y estudiante incorporado al padrón oficial activo.`,
      fecha_hora: new Date().toISOString(),
      estado_anterior: 'PREMATRICULA',
      estado_nuevo: 'MATRICULADO',
      asesor_id: authCtx.userId,
      created_by: authCtx.userId,
    });
  }

  // 9. Registrar evento en bitácora de auditoría
  try {
    const persona = est?.personas;
    const nombreCompleto = persona
      ? `${persona.nombres || ''} ${persona.apellido_paterno || ''}`.trim()
      : 'Estudiante';

    await db.from('audit_logs').insert({
      user_id: authCtx.userId,
      user_role: authCtx.roleName || authCtx.roleCode,
      action: 'UPDATE',
      module: 'MATRICULAS',
      entity: 'matriculas',
      entity_id: mat.id,
      detail: `Validación de pago (S/ ${importeAPagar} vía ${input.medioPago}) y aprobación de matrícula a estado ACTIVA (${nuevoCodigoMat}). Titular: ${nombreCompleto}`,
      data_before: {
        status: mat.status,
        codigo_matricula: mat.codigo_matricula,
      },
      data_after: {
        status: 'ACTIVA',
        codigo_matricula: nuevoCodigoMat,
        importe_pagado: importeAPagar,
      },
      result: 'EXITO',
    });
  } catch {
    // Auditoría tolerante a fallos
  }

  // 10. Revalidar todas las rutas afectadas
  revalidatePath('/matriculas');
  revalidatePath(`/matriculas/${mat.id}`);
  revalidatePath('/reportes/padron-estudiantes');
  revalidatePath('/crm');
  revalidatePath('/dashboard');

  return {
    success: true,
    matriculaId: mat.id,
    codigoMatricula: nuevoCodigoMat,
    importePagado: importeAPagar,
  };
}

export async function rechazarPrematriculaAction(matriculaId: string, motivo?: string) {
  const authCtx = await getUserAuthContext();
  if (!authCtx) {
    return { error: 'Usuario no autenticado.' };
  }

  // Protección: Asesores comerciales no pueden rechazar prematrículas
  if (authCtx.isAsesor) {
    return {
      error: 'Acceso denegado: Los Asesores Comerciales tienen permisos de solo consulta y no pueden rechazar prematrículas.',
    };
  }

  const perms = authCtx.permissions;
  if (!perms.includes('MATRICULAS.GESTIONAR') && !perms.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No cuentas con los permisos requeridos para rechazar prematrículas.' };
  }

  const db = await getSafeDbClient();
  const { data: mat, error: matErr } = await db
    .from('matriculas')
    .select('id, codigo_matricula, status, prospecto_id, estudiante_id')
    .eq('id', matriculaId)
    .single();

  if (matErr || !mat) {
    return { error: 'No se encontró el registro de la matrícula indicada.' };
  }

  if (mat.status === 'ACTIVA') {
    return { error: 'Esta matrícula ya se encuentra ACTIVA. Para revertirla debes usar el flujo formal de anulación de matrícula.' };
  }

  const motivoTexto = (motivo || 'Voucher o pago no validado por Administración/Caja').trim();

  // 1. Marcar matrícula como ANULADA
  const { error: updMatErr } = await db
    .from('matriculas')
    .update({
      status: 'ANULADA',
      motivo_estado: motivoTexto,
      anulada_en: new Date().toISOString(),
      updated_by: authCtx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matriculaId);

  if (updMatErr) {
    return { error: 'Error al rechazar la prematrícula: ' + updMatErr.message };
  }

  // 2. Anular cuotas asociadas si existían
  await db
    .from('cuotas')
    .update({
      status: 'ANULADA',
      updated_at: new Date().toISOString(),
    })
    .eq('matricula_id', matriculaId);

  // 3. Sincronizar prospecto CRM si procede
  if (mat.prospecto_id) {
    await db
      .from('prospectos')
      .update({
        status: 'CONTACTADO',
        matricula_id: null,
        updated_by: authCtx.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mat.prospecto_id);

    await db.from('seguimientos').insert({
      prospecto_id: mat.prospecto_id,
      tipo_actividad: 'NOTA_INTERNA',
      resultado: 'Prematrícula Rechazada en Caja',
      nota: `Prematrícula rechazada: ${motivoTexto}. El prospecto retorna a la etapa de seguimiento comercial para solicitar un nuevo comprobante.`,
      fecha_hora: new Date().toISOString(),
      estado_anterior: 'PREMATRICULA',
      estado_nuevo: 'CONTACTADO',
      asesor_id: authCtx.userId,
      created_by: authCtx.userId,
    });
  }

  // 4. Auditoría
  try {
    await db.from('audit_logs').insert({
      user_id: authCtx.userId,
      user_role: authCtx.roleName || authCtx.roleCode,
      action: 'UPDATE',
      module: 'MATRICULAS',
      entity: 'matriculas',
      entity_id: matriculaId,
      detail: `Rechazo de prematrícula ${mat.codigo_matricula}. Motivo: ${motivoTexto}`,
      data_before: { status: mat.status },
      data_after: { status: 'ANULADA', motivo: motivoTexto },
      result: 'EXITO',
    });
  } catch {
    // Auditoría tolerante a fallos
  }

  revalidatePath('/matriculas');
  revalidatePath(`/matriculas/${matriculaId}`);
  revalidatePath('/crm');
  revalidatePath('/dashboard');

  return { success: true };
}

export async function eliminarMatriculaAction(
  matriculaId: string,
  motivo?: string
): Promise<{ error?: string; success?: boolean }> {
  const authCtx = await getUserAuthContext();
  if (!authCtx) {
    return { error: 'Usuario no autenticado.' };
  }

  // Protección: Asesores comerciales no pueden eliminar matrículas
  if (authCtx.isAsesor) {
    return {
      error: 'Acceso denegado: El rol Asesor Comercial no tiene autorización para eliminar matrículas.',
    };
  }

  const perms = authCtx.permissions || [];
  if (!perms.includes('MATRICULAS.GESTIONAR') && !perms.includes('SISTEMA.ADMINISTRAR')) {
    return { error: 'No cuentas con los permisos requeridos para eliminar matrículas.' };
  }

  const db = await getSafeDbClient();

  // 1. Obtener snapshot completo de la matrícula
  const { data: mat, error: matErr } = await db
    .from('matriculas')
    .select(`
      *,
      estudiantes (
        id,
        persona_id,
        codigo_estudiante,
        personas (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          numero_documento
        )
      )
    `)
    .eq('id', matriculaId)
    .single();

  if (matErr || !mat) {
    return { error: 'No se encontró el registro de la matrícula indicada.' };
  }

  // 2. Obtener cuotas asociadas y sus aplicaciones de pago
  const { data: cuotas } = await db
    .from('cuotas')
    .select('id, numero_cuota, concepto, importe_neto, saldo, status')
    .eq('matricula_id', matriculaId);

  const cuotasSnapshot = cuotas || [];
  const cuotaIds = cuotasSnapshot.map((c) => c.id);

  let appsSnapshot: any[] = [];
  if (cuotaIds.length > 0) {
    const { data: apps } = await db
      .from('pago_aplicaciones')
      .select('id, pago_id, cuota_id, importe_aplicado')
      .in('cuota_id', cuotaIds);
    appsSnapshot = apps || [];
  }

  // 3. REGISTRO PREVIO EN LA BITÁCORA DE AUDITORÍA ANTES DE EJECUTAR EL BORRADO FÍSICO
  const est = Array.isArray(mat.estudiantes) ? mat.estudiantes[0] : mat.estudiantes;
  const persona = est?.personas;
  const nombreEstudiante = persona
    ? `${persona.nombres || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim()
    : 'Estudiante';
  const dni = persona?.numero_documento || 'Sin DNI';
  const motivoTexto = (motivo || 'Eliminación física definitiva autorizada por administración').trim();
  const now = new Date();
  const fechaHora = now.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  try {
    await db.from('audit_logs').insert({
      action: 'DELETE',
      entity: 'matriculas',
      entity_id: matriculaId,
      module: 'MATRICULAS',
      user_id: authCtx.userId,
      user_role: authCtx.roleName || authCtx.roleCode || 'SUPER_ADMINISTRADOR',
      detail: `Eliminación física definitiva (Hard Delete) de matrícula ${mat.codigo_matricula || matriculaId} (${nombreEstudiante} - DNI ${dni}) - ${fechaHora}. Motivo: ${motivoTexto}`,
      data_before: {
        matricula: mat,
        cuotas: cuotasSnapshot,
        pago_aplicaciones: appsSnapshot,
        fecha_eliminacion: now.toISOString(),
        eliminado_por: authCtx.userId,
        motivo: motivoTexto,
      },
      data_after: {
        status: 'ELIMINADO_FISICO',
        deleted_at: now.toISOString(),
        hard_delete: true,
      },
      result: 'EXITO',
    });
  } catch (auditErr) {
    console.warn('[eliminarMatriculaAction] Error audit:', auditErr);
  }

  // 4. Cascada de eliminación física: aplicaciones de pago y cuotas
  if (cuotaIds.length > 0) {
    await db.from('pago_aplicaciones').delete().in('cuota_id', cuotaIds);
    const { error: delCuotasErr } = await db
      .from('cuotas')
      .delete()
      .eq('matricula_id', matriculaId);

    if (delCuotasErr) {
      return { error: `Error al eliminar cuotas asociadas: ${delCuotasErr.message}` };
    }
  }

  // 5. Desvincular referencias circulares con prospectos
  await db
    .from('prospectos')
    .update({ matricula_id: null })
    .eq('matricula_id', matriculaId);

  await db
    .from('matriculas')
    .update({ prospecto_id: null })
    .eq('id', matriculaId);

  // 6. Borrado físico definitivo (Hard Delete) de la tabla matriculas
  const { error: delMatErr } = await db
    .from('matriculas')
    .delete()
    .eq('id', matriculaId);

  if (delMatErr) {
    return { error: `Error al eliminar físicamente la matrícula: ${delMatErr.message}` };
  }

  // 7. Revalidar rutas
  revalidatePath('/matriculas');
  revalidatePath('/reportes/padron-estudiantes');
  revalidatePath('/crm');
  revalidatePath('/dashboard');
  revalidatePath('/auditoria');

  return { success: true };
}


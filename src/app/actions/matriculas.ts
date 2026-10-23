'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/auth/permissions';
import { confirmarMatriculaSchema, registrarPagoSchema } from '@/lib/validators/matriculas';

export async function confirmarMatriculaAction(payload: unknown) {
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
  return { success: true, pago_id: data };
}

export async function anularPagoAction(pagoId: string, motivo: string) {
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

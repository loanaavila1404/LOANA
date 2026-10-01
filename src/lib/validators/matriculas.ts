import { z } from 'zod';

export const confirmarMatriculaSchema = z.object({
  estudiante_id: z.string().uuid(),
  edicion_id: z.string().uuid(),
  ciclo_id: z.string().uuid().optional().nullable(),
  prospecto_id: z.string().uuid().optional().nullable(),
  asesor_id: z.string().uuid().optional().nullable(),
  importe_matricula: z.number().min(0),
  importe_pension: z.number().min(0),
  numero_pensiones: z.number().int().min(1),
  descuento_total: z.number().min(0).optional().default(0),
  descuento_motivo: z.string().optional().nullable(),
  primer_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe ser YYYY-MM-DD'),
  frecuencia_meses: z.number().int().min(1).default(1),
});

export const registrarPagoSchema = z.object({
  idempotency_key: z.string().uuid(),
  estudiante_id: z.string().uuid(),
  importe: z.number().positive(),
  medio_pago: z.string().min(1),
  numero_operacion: z.string().optional().nullable(),
  comprobante_tipo: z.string().optional().nullable(),
  comprobante_numero: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  cuotas_aplicadas: z.array(z.object({
    cuota_id: z.string().uuid(),
    importe: z.number().positive()
  })).min(1, 'Debe aplicar a al menos una cuota')
});

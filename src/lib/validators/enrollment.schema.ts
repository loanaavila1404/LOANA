import { z } from 'zod';
import { dateSchema } from './common.schema';
import { TIPOS_CUOTA } from '../constants/catalogs';

export const createPreEnrollmentSchema = z.object({
  estudianteId: z.string().uuid(),
  edicionId: z.string().uuid(),
  observaciones: z.string().optional(),
});

export const reserveVacancySchema = z.object({
  montoPago: z.number().positive(),
  metodoPago: z.string(),
  comprobantePago: z.string().optional(),
});

export const activateEnrollmentSchema = z.object({
  fechaActivacion: dateSchema.default(() => new Date().toISOString()),
});

export const createPaymentSchema = z.object({
  matriculaId: z.string().uuid(),
  tipoCuota: z.enum(TIPOS_CUOTA),
  monto: z.number().positive(),
  fechaVencimiento: dateSchema,
  descripcion: z.string().optional(),
});

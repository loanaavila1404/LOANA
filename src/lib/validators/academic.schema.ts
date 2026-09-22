import { z } from 'zod';
import { TIPOS_PROGRAMA } from '../constants/catalogs';
import { dateSchema } from './common.schema';

export const createProgramSchema = z.object({
  codigo: z.string().min(3).max(20),
  nombre: z.string().min(3).max(100),
  tipo: z.enum(TIPOS_PROGRAMA),
  descripcion: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

export const createPlanSchema = z.object({
  programaId: z.string().uuid(),
  codigo: z.string().min(2).max(20),
  nombre: z.string().min(3).max(100),
  totalCiclos: z.number().int().min(1).max(20),
  resolucion: z.string().optional(),
});

export const createPeriodSchema = z.object({
  codigo: z.string().min(4).max(10), // e.g., 2026-I
  nombre: z.string().min(3).max(50),
  fechaInicio: dateSchema,
  fechaFin: dateSchema,
}).refine(data => new Date(data.fechaInicio) < new Date(data.fechaFin), {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['fechaFin'],
});

export const createCourseSchema = z.object({
  planId: z.string().uuid(),
  ciclo: z.number().int().min(1),
  codigo: z.string().min(3).max(20),
  nombre: z.string().min(3).max(100),
  creditos: z.number().int().min(1).optional(),
  horasTeoricas: z.number().int().min(0).optional(),
  horasPracticas: z.number().int().min(0).optional(),
});

export const createEditionSchema = z.object({
  programaId: z.string().uuid(),
  planId: z.string().uuid(),
  periodoId: z.string().uuid(),
  nombre: z.string().min(3).max(100),
  fechaInicio: dateSchema,
  fechaFin: dateSchema,
  vacantes: z.number().int().min(1),
  modalidad: z.enum(['PRESENCIAL', 'SEMI_PRESENCIAL', 'VIRTUAL']).default('PRESENCIAL'),
}).refine(data => new Date(data.fechaInicio) < new Date(data.fechaFin), {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['fechaFin'],
});

export const createScheduleSchema = z.object({
  edicionId: z.string().uuid(),
  cursoId: z.string().uuid(),
  docenteId: z.string().uuid().optional(),
  dia: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido'),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido'),
  aula: z.string().max(50).optional(),
}).refine(data => data.horaInicio < data.horaFin, {
  message: 'La hora de inicio debe ser anterior a la hora de fin',
  path: ['horaFin'],
});

export const createCycleSchema = z.object({
  edicionId: z.string().uuid(),
  numero: z.number().int().min(1),
  fechaInicio: dateSchema,
  fechaFin: dateSchema,
}).refine(data => new Date(data.fechaInicio) < new Date(data.fechaFin), {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['fechaFin'],
});

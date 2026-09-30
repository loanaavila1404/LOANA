import { z } from 'zod';

// --- PROGRAMAS ---
export const programaSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').transform(v => v.trim().toUpperCase()),
  nombre: z.string().min(1, 'El nombre es requerido').transform(v => v.trim()),
  tipo_programa: z.enum(['CARRERA_TECNICA', 'CURSO_CORTO', 'PROGRAMA_VARIABLE'], {
    message: 'Tipo de programa inválido'
  }),
  duracion_cantidad: z.coerce.number().int().min(1).optional().nullable(),
  duracion_unidad: z.string().optional().nullable(),
  total_ciclos: z.coerce.number().int().min(1).optional().nullable(),
  descripcion: z.string().optional().nullable(),
  status: z.string().default('ACTIVO'),
});

export type ProgramaInput = z.infer<typeof programaSchema>;

// --- PLANES DE ESTUDIO ---
export const planEstudioSchema = z.object({
  programa_id: z.string().uuid('ID de programa requerido'),
  codigo: z.string().min(1, 'El código es requerido').transform(v => v.trim().toUpperCase()),
  nombre: z.string().min(1, 'El nombre es requerido').transform(v => v.trim()),
  version: z.string().optional().nullable(),
  fecha_vigencia_desde: z.string().optional().nullable(),
  fecha_vigencia_hasta: z.string().optional().nullable(),
  total_ciclos: z.coerce.number().int().min(1).optional().nullable(),
  status: z.string().default('ACTIVO'),
});

export type PlanEstudioInput = z.infer<typeof planEstudioSchema>;

// --- CICLOS ---
export const cicloSchema = z.object({
  plan_id: z.string().uuid('ID de plan requerido'),
  numero_orden: z.coerce.number().int().min(1, 'El número de orden es requerido'),
  codigo: z.string().optional().nullable().transform(v => v ? v.trim().toUpperCase() : v),
  nombre: z.string().optional().nullable(),
  status: z.string().default('ACTIVO'),
});

export type CicloInput = z.infer<typeof cicloSchema>;

// --- CURSOS ---
export const cursoSchema = z.object({
  plan_id: z.string().uuid('ID de plan requerido'),
  ciclo_id: z.string().uuid('ID de ciclo requerido'),
  codigo: z.string().optional().nullable().transform(v => v ? v.trim().toUpperCase() : v),
  nombre: z.string().min(1, 'El nombre del curso es requerido').transform(v => v.trim()),
  horas_semanales: z.coerce.number().int().min(0).optional().nullable(),
  creditos: z.coerce.number().int().min(0).optional().nullable(),
  status: z.string().default('ACTIVO'),
});

export type CursoInput = z.infer<typeof cursoSchema>;

// --- PERIODOS ---
export const periodoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').transform(v => v.trim().toUpperCase()),
  nombre: z.string().min(1, 'El nombre es requerido').transform(v => v.trim()),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  status: z.string().default('ACTIVO'),
}).refine(data => {
  if (data.fecha_inicio && data.fecha_fin) {
    return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
  }
  return true;
}, {
  message: 'La fecha de fin debe ser mayor o igual a la de inicio',
  path: ['fecha_fin'],
});

export type PeriodoInput = z.infer<typeof periodoSchema>;

// --- EDICIONES ---
export const edicionSchema = z.object({
  programa_id: z.string().uuid('ID de programa requerido'),
  plan_id: z.string().uuid('ID de plan requerido'),
  periodo_id: z.string().uuid('ID de periodo requerido'),
  ciclo_id: z.string().uuid('ID de ciclo requerido'),
  codigo: z.string().min(1, 'El código es requerido').transform(v => v.trim().toUpperCase()),
  nombre: z.string().optional().nullable().transform(v => v ? v.trim() : v),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  turno: z.string().optional().nullable(),
  modalidad: z.string().optional().nullable(),
  vacantes: z.coerce.number().int().min(1).optional().nullable(),
  precio_matricula: z.coerce.number().min(0).optional().nullable(),
  precio_pension: z.coerce.number().min(0).optional().nullable(),
  numero_pensiones: z.coerce.number().int().min(0).optional().nullable(),
  dias_reserva: z.coerce.number().int().min(0).optional().nullable().default(7),
  primer_vencimiento: z.string().optional().nullable(),
  frecuencia_meses: z.coerce.number().int().min(1).optional().nullable().default(1),
  status: z.string().default('ACTIVO'),
}).refine(data => {
  if (data.fecha_inicio && data.fecha_fin) {
    return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
  }
  return true;
}, {
  message: 'La fecha de fin debe ser mayor o igual a la de inicio',
  path: ['fecha_fin'],
});

export type EdicionInput = z.infer<typeof edicionSchema>;

// --- HORARIOS ---
export const horarioSchema = z.object({
  edicion_id: z.string().uuid('ID de edición requerido'),
  curso_id: z.string().uuid('ID de curso requerido'),
  dia_semana: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'], {
    message: 'Día inválido'
  }),
  hora_inicio: z.string().min(5, 'Requerido'), // "HH:MM"
  hora_fin: z.string().min(5, 'Requerido'), // "HH:MM"
  ubicacion: z.string().optional().nullable(),
  docente: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  status: z.string().default('ACTIVO'),
}).refine(data => {
  if (data.hora_inicio && data.hora_fin) {
    return data.hora_fin > data.hora_inicio;
  }
  return true;
}, {
  message: 'La hora de fin debe ser mayor a la de inicio',
  path: ['hora_fin'],
});

export type HorarioInput = z.infer<typeof horarioSchema>;

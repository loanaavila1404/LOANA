import { z } from 'zod';

export const programaSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  duracion_cantidad: z.coerce.number().optional(),
  duracion_unidad: z.string().optional(),
  tipo_programa: z.string().optional(),
  total_ciclos: z.coerce.number().optional(),
  status: z.string().default('activo'),
});

export type ProgramaInput = z.infer<typeof programaSchema>;

export const edicionSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  programa_id: z.string().optional(),
  plan_id: z.string().optional(),
  ciclo_id: z.string().optional(),
  periodo_id: z.string().optional(),
  nombre: z.string().optional(),
  modalidad: z.string().optional(),
  turno: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  vacantes: z.coerce.number().optional(),
  precio_matricula: z.coerce.number().optional(),
  precio_pension: z.coerce.number().optional(),
  numero_pensiones: z.coerce.number().optional(),
  frecuencia_meses: z.coerce.number().optional(),
  dias_reserva: z.coerce.number().optional(),
  primer_vencimiento: z.string().optional(),
  status: z.string().default('activo'),
});

export type EdicionInput = z.infer<typeof edicionSchema>;

import { z } from 'zod';
import { documentTypeSchema, documentNumberSchema, phoneSchema, emailSchema, dateSchema } from './common.schema';

export const createStudentSchema = z.object({
  tipoDocumento: documentTypeSchema,
  numeroDocumento: documentNumberSchema,
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  fechaNacimiento: dateSchema.optional(),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']).optional(),
  correo: emailSchema.optional().or(z.literal('')),
  telefono: phoneSchema.optional().or(z.literal('')),
  direccion: z.string().max(255).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const changeStudentStatusSchema = z.object({
  estado: z.enum(['REGISTRADO', 'MATRICULADO', 'RETIRADO', 'EGRESADO']),
  motivo: z.string().max(255).optional(),
});

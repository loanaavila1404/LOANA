import { z } from 'zod';
import { NIVELES_INTERES, CANALES_CAPTACION, TIPOS_ACTIVIDAD_CRM } from '../constants/catalogs';
import { dateSchema, phoneSchema, emailSchema } from './common.schema';

export const createProspectSchema = z.object({
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  correo: emailSchema.optional().or(z.literal('')),
  telefono: phoneSchema.optional().or(z.literal('')),
  programaInteresId: z.string().uuid().optional(),
  nivelInteres: z.enum(NIVELES_INTERES).default('MEDIO'),
  canalCaptacion: z.enum(CANALES_CAPTACION).default('OTROS'),
  notas: z.string().optional(),
});

export const updateProspectSchema = createProspectSchema.partial();

export const createFollowUpSchema = z.object({
  prospectoId: z.string().uuid(),
  tipoActividad: z.enum(TIPOS_ACTIVIDAD_CRM),
  fechaHora: dateSchema,
  descripcion: z.string().min(5),
  resultado: z.string().optional(),
});

export const createTaskSchema = z.object({
  prospectoId: z.string().uuid(),
  titulo: z.string().min(5).max(100),
  descripcion: z.string().optional(),
  fechaVencimiento: dateSchema,
  asignadoA: z.string().uuid().optional(),
});

export const transferProspectSchema = z.object({
  nuevoAsesorId: z.string().uuid(),
  notasTransferencia: z.string().optional(),
});

export const markAsLostSchema = z.object({
  motivoPerdida: z.string().min(3),
  notasAdicionales: z.string().optional(),
});

export const convertProspectSchema = z.object({
  studentData: z.any().optional(),
});

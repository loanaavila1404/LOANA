import { z } from 'zod';
import { CODIGOS_ROL } from '../constants/catalogs';
import { emailSchema } from './common.schema';

export const inviteUserSchema = z.object({
  correo: emailSchema,
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  rolCodigo: z.enum(CODIGOS_ROL),
});

export const changeUserRoleSchema = z.object({
  rolCodigo: z.enum(CODIGOS_ROL),
});

export const changeUserStatusSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']),
});

export const updateProfileSchema = z.object({
  nombres: z.string().min(2).optional(),
  apellidos: z.string().min(2).optional(),
  telefono: z.string().optional(),
});

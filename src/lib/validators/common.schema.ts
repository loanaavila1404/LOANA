import { z } from 'zod';
import { TIPOS_DOCUMENTO } from '../constants/catalogs';

export const documentTypeSchema = z.enum(TIPOS_DOCUMENTO, {
  required_error: 'El tipo de documento es requerido',
  invalid_type_error: 'Tipo de documento no válido',
});

export const dniSchema = z.string()
  .length(8, 'El DNI debe tener exactamente 8 dígitos')
  .regex(/^\d+$/, 'El DNI solo debe contener números');

export const documentNumberSchema = z.string()
  .min(8, 'El documento debe tener al menos 8 caracteres')
  .max(15, 'El documento no debe exceder los 15 caracteres')
  .regex(/^[A-Z0-9]+$/, 'El documento solo debe contener letras mayúsculas y números');

export const phoneSchema = z.string()
  .min(9, 'El teléfono debe tener al menos 9 dígitos')
  .max(15, 'El teléfono es demasiado largo')
  .regex(/^\+?[0-9]+$/, 'El teléfono solo debe contener números y opcionalmente el signo + al inicio');

export const emailSchema = z.string().email('El correo electrónico no es válido');

export const dateSchema = z.string().or(z.date()).refine(val => {
  const d = new Date(val);
  return !isNaN(d.getTime());
}, { message: 'Fecha no válida' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const statusSchema = z.enum(['ACTIVO', 'INACTIVO'], {
  invalid_type_error: 'Estado no válido',
});

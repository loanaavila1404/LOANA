import { z } from 'zod';

export const prospectoSchema = z.object({
  tipo_documento: z.string().optional().nullable(),
  numero_documento: z.string().optional().nullable(),
  nombres: z.string().min(1, 'Los nombres son obligatorios').transform(v => v.trim()),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios').transform(v => v.trim()),
  telefono: z.string().min(5, 'El teléfono es obligatorio'),
  telefono_alt: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  departamento: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  distrito: z.string().optional().nullable(),
  programa_id: z.string().uuid('Debe seleccionar un programa').optional().nullable(),
  plan_id: z.string().uuid().optional().nullable(),
  edicion_id: z.string().uuid().optional().nullable(),
  modalidad: z.string().optional().nullable(),
  turno: z.string().optional().nullable(),
  canal_captacion: z.string().optional().nullable(),
  campana: z.string().optional().nullable(),
  asesor_id: z.string().uuid().optional().nullable(),
  status: z.string().default('NUEVO'),
  nivel_interes: z.string().optional().nullable(),
  consentimiento_contacto: z.boolean().default(true).optional(),
  observaciones: z.string().optional().nullable(),
});

export const seguimientoSchema = z.object({
  prospecto_id: z.string().uuid(),
  tipo_actividad: z.string().min(1, 'Requerido'),
  resultado: z.string().optional().nullable(),
  nota: z.string().min(1, 'La nota es obligatoria'),
  estado_nuevo: z.string().optional().nullable(),
  proximo_seguimiento: z.string().optional().nullable(), // date string
});

export const tareaSchema = z.object({
  prospecto_id: z.string().uuid(),
  tipo_tarea: z.string().min(1, 'Requerido'),
  titulo: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional().nullable(),
  fecha_programada: z.string().min(1, 'Requerida'),
  status: z.string().default('PENDIENTE'),
});

export const transferenciaSchema = z.object({
  prospecto_id: z.string().uuid(),
  asesor_nuevo_id: z.string().uuid('Debe seleccionar un asesor'),
  motivo: z.string().min(1, 'El motivo es requerido'),
});

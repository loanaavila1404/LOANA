import { z } from "zod";

export const personaSchema = z.object({
  id: z.string().optional(),
  nombres: z.string().min(1, "Los nombres son requeridos"),
  apellido_paterno: z.string().min(1, "El apellido paterno es requerido"),
  apellido_materno: z.string().optional(),
  tipo_documento: z.string().min(1, "Tipo de documento es requerido"),
  numero_documento: z.string().min(1, "Número de documento es requerido"),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal('')),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  direccion: z.string().optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  status: z.enum(["activo", "inactivo"]).default("activo"),
  es_estudiante: z.boolean().default(false),
  // Estudiante specific
  codigo_estudiante: z.string().optional(),
  observaciones: z.string().optional(),
});

export type PersonaFormData = z.infer<typeof personaSchema>;

import { z } from "zod";

export const prospectoSchema = z.object({
  nombres: z.string().min(2, "El nombre es obligatorio"),
  apellidos: z.string().min(2, "El apellido es obligatorio"),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  status: z.string().default("NUEVO"),
  nivel_interes: z.string().default("MEDIO"),
  codigo: z.string().optional(),
});

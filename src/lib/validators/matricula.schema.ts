import { z } from 'zod';

export const createMatriculaSchema = z.object({
  estudiante_id: z.string().uuid("Estudiante no válido"),
  edicion_id: z.string().uuid("Edición no válida"),
  importe_matricula: z.coerce.number().min(0, "Importe debe ser mayor o igual a 0").optional().default(0),
  observaciones: z.string().optional(),
  
  // Opcional: registrar pago inicial
  registrar_pago: z.boolean().default(false),
  monto_pago: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  medio_pago: z.string().optional(),
});

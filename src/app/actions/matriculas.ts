'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionState } from '@/lib/utils/actions'
import { createMatriculaSchema } from '@/lib/validators/matricula.schema'
import { revalidatePath } from 'next/cache'

export async function createMatricula(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const registrarPago = rawData.registrar_pago === 'on' || rawData.registrar_pago === 'true'
    
    const validatedData = createMatriculaSchema.parse({
      ...rawData,
      registrar_pago: registrarPago,
    })

    const supabase = await createClient()

    // Generar un código de matrícula temporal
    const codigo_matricula = `MAT-${Date.now()}`

    // Crear matrícula
    const { data: matricula, error: matriculaError } = await supabase
      .from('matriculas')
      .insert({
        codigo_matricula,
        estudiante_id: validatedData.estudiante_id,
        edicion_id: validatedData.edicion_id,
        importe_matricula: validatedData.importe_matricula,
        observaciones: validatedData.observaciones || null,
        status: 'CONFIRMADA',
        fecha_matricula: new Date().toISOString(),
      })
      .select('id, estudiante_id')
      .single()

    if (matriculaError) throw new Error(`Error al crear matrícula: ${matriculaError.message}`)

    // Si registrar_pago es verdadero y hay monto, creamos un pago
    if (validatedData.registrar_pago && validatedData.monto_pago && validatedData.monto_pago > 0) {
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
          estudiante_id: matricula.estudiante_id,
          importe: validatedData.monto_pago,
          medio_pago: validatedData.medio_pago || 'EFECTIVO',
          status: 'APROBADO',
          fecha_pago: new Date().toISOString(),
          observaciones: `Pago inicial de matrícula ${codigo_matricula}`,
        })

      if (pagoError) throw new Error(`Error al registrar pago: ${pagoError.message}`)
    }

    revalidatePath('/matriculas')

    return {
      success: true,
      message: 'Matrícula creada exitosamente.',
    }
  } catch (error: any) {
    console.error('Create Matricula Error:', error)
    if (error.name === 'ZodError') {
      return {
        success: false,
        message: 'Por favor, revise los datos del formulario.',
        errors: error.flatten().fieldErrors,
      }
    }
    return {
      success: false,
      message: error.message || 'Ocurrió un error inesperado al crear la matrícula.',
    }
  }
}

'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSedeContext, NEXT_PUBLIC_SEDES_ENABLED } from '@/lib/services/sede-context'
import { TOKEN_SEDE_TODAS } from '@/lib/types'
import { getUserPermissions } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

const changeSedeSchema = z.object({
  sedeId: z.union([
    z.literal(TOKEN_SEDE_TODAS),
    z.string().uuid('Identificador de sede inválido')
  ])
})

export type ChangeSedeResult =
  | { success: true }
  | { success: false; code: 'DISABLED' | 'UNAUTHORIZED' | 'INVALID_PAYLOAD' | 'NO_ACCESS' | 'QUERY_ERROR'; message: string };

export async function changeSedeAction(formData: FormData): Promise<ChangeSedeResult> {
  if (!NEXT_PUBLIC_SEDES_ENABLED) {
    return { success: false, code: 'DISABLED', message: 'Las sedes están deshabilitadas' }
  }

  const sedeIdRaw = formData.get('sedeId')

  const parsed = changeSedeSchema.safeParse({
    sedeId: typeof sedeIdRaw === 'string' ? sedeIdRaw : '',
  })

  if (!parsed.success) {
    return { success: false, code: 'INVALID_PAYLOAD', message: 'Payload inválido' }
  }

  const requestedSede = parsed.data.sedeId

  // Validar sesión
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, code: 'UNAUTHORIZED', message: 'No autorizado' }
  }

  // 1. Fetch real permissions on server using the official utility
  const permissions = await getUserPermissions()

  // 2. Resolve via centralized service to check if requestedSede is actually allowed
  const context = await getSedeContext(user.id, permissions, requestedSede)

  if (context.estado === 'ERROR') {
    return { success: false, code: 'QUERY_ERROR', message: 'Error al consultar sedes' }
  }

  if (context.estado === 'SIN_ACCESO' || context.sinAcceso) {
    return { success: false, code: 'NO_ACCESS', message: 'No tienes acceso a ninguna sede' }
  }

  if (!context.sedeEfectiva) {
    return { success: false, code: 'UNAUTHORIZED', message: 'Sede no autorizada o no disponible' }
  }

  const isMatch = context.sedeEfectiva.tipo === 'TODAS' 
    ? requestedSede === TOKEN_SEDE_TODAS
    : context.sedeEfectiva.sedeId === requestedSede;

  if (!isMatch) {
    return { success: false, code: 'UNAUTHORIZED', message: 'No tienes permisos para seleccionar esta sede' }
  }

  // 3. Set valid cookie
  const cookieStore = await cookies()
  cookieStore.set('erp_sede', requestedSede, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Server only
  })

  return { success: true }
}

export async function clearSedeCookieAction() {
  const cookieStore = await cookies()
  cookieStore.delete('erp_sede')
  return { success: true }
}

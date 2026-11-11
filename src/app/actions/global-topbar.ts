'use server'

import { createClient, getSafeDbClient } from '@/lib/supabase/server'
import { isCurrentUserAdvisor } from '@/lib/auth/permissions'

export interface GlobalSearchResultItem {
  id: string
  category: 'ESTUDIANTE' | 'MATRICULA' | 'PROGRAMA' | 'PROSPECTO'
  title: string
  subtitle: string
  code?: string
  status?: string
  href: string
}

export interface OperationalNotificationItem {
  id: string
  type: 'CUOTA' | 'PREMATRICULA' | 'TAREA_CRM'
  title: string
  description: string
  meta: string
  severity: 'red' | 'amber' | 'blue'
  href: string
}

export async function globalSearch(rawQuery: string): Promise<GlobalSearchResultItem[]> {
  const query = (rawQuery || '').trim()
  if (query.length < 2) {
    return []
  }

  const supabase = await createClient()
  const db = await getSafeDbClient()
  const isAdvisor = await isCurrentUserAdvisor()
  const { data: { user } } = await supabase.auth.getUser()
  const safeTerm = query.replace(/[%_]/g, '')
  const pattern = `%${safeTerm}%`

  let prospectosQuery = db
    .from('prospectos')
    .select('id, codigo, nombres, apellidos, numero_documento, telefono, status')
    .or(
      `nombres.ilike.${pattern},apellidos.ilike.${pattern},numero_documento.ilike.${pattern},telefono.ilike.${pattern},codigo.ilike.${pattern}`
    )
    .limit(5)

  if (isAdvisor && user?.id) {
    prospectosQuery = prospectosQuery.eq('asesor_id', user.id)
  }

  const [personasRes, matriculasRes, programasRes, prospectosRes] = await Promise.all([
    supabase
      .from('personas')
      .select('id, nombres, apellido_paterno, apellido_materno, tipo_documento, numero_documento, status, estudiantes(codigo_estudiante)')
      .or(
        `nombres.ilike.${pattern},apellido_paterno.ilike.${pattern},apellido_materno.ilike.${pattern},numero_documento.ilike.${pattern}`
      )
      .limit(5),
    supabase
      .from('matriculas')
      .select(
        'id, codigo_matricula, status, estudiantes(codigo_estudiante, personas(nombres, apellido_paterno, apellido_materno, numero_documento)), ediciones(codigo, programas(nombre))'
      )
      .ilike('codigo_matricula', pattern)
      .limit(5),
    supabase
      .from('programas')
      .select('id, codigo, nombre, tipo_programa, status')
      .or(`nombre.ilike.${pattern},codigo.ilike.${pattern}`)
      .limit(5),
    prospectosQuery,
  ])

  const results: GlobalSearchResultItem[] = []

  for (const p of personasRes.data || []) {
    const est = Array.isArray(p.estudiantes) ? p.estudiantes[0] : p.estudiantes
    const fullName = `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim()
    results.push({
      id: `per-${p.id}`,
      category: 'ESTUDIANTE',
      title: fullName || 'Persona registrada',
      subtitle: `${p.tipo_documento || 'DNI'}: ${p.numero_documento || '-'}${est?.codigo_estudiante ? ` • Cód: ${est.codigo_estudiante}` : ''}`,
      code: est?.codigo_estudiante || p.numero_documento || undefined,
      status: p.status || 'ACTIVO',
      href: `/personas/${p.id}`,
    })
  }

  for (const m of matriculasRes.data || []) {
    const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes
    const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas
    const ed = Array.isArray(m.ediciones) ? m.ediciones[0] : m.ediciones
    const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas
    const alumnoNombre = per
      ? `${per.nombres || ''} ${per.apellido_paterno || ''}`.trim()
      : 'Estudiante'

    results.push({
      id: `mat-${m.id}`,
      category: 'MATRICULA',
      title: `${m.codigo_matricula} — ${alumnoNombre}`,
      subtitle: `${prog?.nombre || 'Programa académico'} (${ed?.codigo || 'Edición'})`,
      code: m.codigo_matricula,
      status: m.status || 'ACTIVA',
      href: `/matriculas/${m.id}`,
    })
  }

  for (const prog of programasRes.data || []) {
    results.push({
      id: `prog-${prog.id}`,
      category: 'PROGRAMA',
      title: prog.nombre,
      subtitle: `Código: ${prog.codigo} • ${(prog.tipo_programa || '').replace(/_/g, ' ')}`,
      code: prog.codigo,
      status: prog.status || 'ACTIVO',
      href: `/oferta/programas/${prog.id}`,
    })
  }

  for (const pr of prospectosRes.data || []) {
    results.push({
      id: `prosp-${pr.id}`,
      category: 'PROSPECTO',
      title: `${pr.nombres || ''} ${pr.apellidos || ''}`.trim() || pr.codigo,
      subtitle: `Prospecto ${pr.codigo || ''} • Tel: ${pr.telefono || '-'}`,
      code: pr.codigo || undefined,
      status: pr.status || 'NUEVO',
      href: `/crm/prospectos/${pr.id}`,
    })
  }

  return results
}

export async function getOperationalNotifications(): Promise<OperationalNotificationItem[]> {
  const supabase = await createClient()
  const isAdvisor = await isCurrentUserAdvisor()
  const { data: { user } } = await supabase.auth.getUser()

  let tareasQuery = supabase
    .from('tareas_comerciales')
    .select('id, prospecto_id, tipo_tarea, titulo, descripcion, fecha_programada, status, prospectos(nombres, apellidos, codigo)')
    .eq('status', 'PENDIENTE')
    .order('fecha_programada', { ascending: true })
    .limit(5)

  if (isAdvisor && user?.id) {
    tareasQuery = tareasQuery.eq('asesor_id', user.id)
  }

  const [cuotasRes, prematriculasRes, tareasRes] = await Promise.all([
    supabase
      .from('cuotas')
      .select(
        'id, matricula_id, concepto, fecha_vencimiento, importe_neto, saldo, status, matriculas(id, codigo_matricula, estudiantes(personas(nombres, apellido_paterno)))'
      )
      .in('status', ['PENDIENTE', 'VENCIDA', 'PARCIAL'])
      .order('fecha_vencimiento', { ascending: true })
      .limit(8),
    supabase
      .from('matriculas')
      .select(
        'id, codigo_matricula, fecha_matricula, status, estudiantes(personas(nombres, apellido_paterno)), ediciones(codigo, programas(nombre))'
      )
      .in('status', ['PREMATRICULA', 'RESERVADA'])
      .order('created_at', { ascending: false })
      .limit(5),
    tareasQuery,
  ])

  const notifications: OperationalNotificationItem[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  // 10. Agrupación y optimización de alertas de cobranza (restringidas a 3-5 días)
  const proximasAVencer: any[] = []
  let sumaProximas = 0
  const vencidas: any[] = []
  let sumaVencidas = 0

  for (const c of cuotasRes.data || []) {
    const isOverdue = c.status === 'VENCIDA' || (c.fecha_vencimiento && c.fecha_vencimiento < todayStr)
    const monto = Number(c.saldo ?? c.importe_neto ?? 0)

    if (isOverdue) {
      vencidas.push(c)
      sumaVencidas += monto
    } else if (c.fecha_vencimiento) {
      const fVenc = new Date(c.fecha_vencimiento + 'T00:00:00')
      const diffTime = fVenc.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Restringir alertas preventivas a cuotas por vencer en 3 a 5 días
      if (diffDays >= 0 && diffDays <= 5) {
        proximasAVencer.push(c)
        sumaProximas += monto
      }
    }
  }

  // Notificación global consolidada para pensiones próximas a vencer
  if (proximasAVencer.length > 0) {
    notifications.push({
      id: 'notif-cuotas-global-proximas',
      type: 'CUOTA',
      title: 'Pensiones próximas a vencer',
      description: `${proximasAVencer.length} pensión(es) por vencer en los próximos 3 a 5 días • Total: S/ ${sumaProximas.toFixed(2)}`,
      meta: 'Cobranza preventiva (3 a 5 días)',
      severity: 'amber',
      href: '/matriculas',
    })
  }

  // Notificación global consolidada para pensiones vencidas
  if (vencidas.length > 0) {
    notifications.push({
      id: 'notif-cuotas-global-vencidas',
      type: 'CUOTA',
      title: 'Pensiones vencidas por regularizar',
      description: `${vencidas.length} cuota(s) vencidas pendientes de pago • Total: S/ ${sumaVencidas.toFixed(2)}`,
      meta: 'Cobranza urgente',
      severity: 'red',
      href: '/matriculas',
    })
  }

  for (const pm of prematriculasRes.data || []) {
    const est = Array.isArray(pm.estudiantes) ? pm.estudiantes[0] : pm.estudiantes
    const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas
    const ed = Array.isArray(pm.ediciones) ? pm.ediciones[0] : pm.ediciones
    const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas
    const studentName = per ? `${per.nombres || ''} ${per.apellido_paterno || ''}`.trim() : 'Estudiante'

    notifications.push({
      id: `notif-premat-${pm.id}`,
      type: 'PREMATRICULA',
      title: `Prematrícula por activar: ${pm.codigo_matricula}`,
      description: `${studentName} — ${prog?.nombre || ed?.codigo || 'Programa'}`,
      meta: `Estado: ${pm.status}`,
      severity: 'amber',
      href: `/matriculas/${pm.id}`,
    })
  }

  for (const t of tareasRes.data || []) {
    const prosp = Array.isArray(t.prospectos) ? t.prospectos[0] : t.prospectos
    const prospName = prosp ? `${prosp.nombres || ''} ${prosp.apellidos || ''}`.trim() : 'Prospecto CRM'

    notifications.push({
      id: `notif-tarea-${t.id}`,
      type: 'TAREA_CRM',
      title: `Seguimiento CRM (${t.tipo_tarea || 'Tarea'}): ${prospName}`,
      description: t.titulo || t.descripcion || 'Seguimiento comercial programado',
      meta: t.fecha_programada ? `Programada: ${t.fecha_programada.slice(0, 10)}` : 'Pendiente',
      severity: 'blue',
      href: t.prospecto_id ? `/crm/prospectos/${t.prospecto_id}` : '/crm/prospectos',
    })
  }

  return notifications
}
